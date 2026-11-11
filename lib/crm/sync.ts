import 'server-only';
import { brevoConfig, brevoPost } from '@/lib/brevo/client';
import { dbRecordSync } from './db';

/**
 * Future syncs Supabase → Brevo / Airtable (prepared 2026-11-11, NOT active).
 *
 * Supabase is the source of truth. Every change queues a row in external_sync_status (sync_status 'pending'), written
 * by the database functions themselves (0010_crm.sql → crm_queue_sync). Nothing leaves the server until BOTH:
 *   • the switch is on: CRM_SYNC_BREVO_ENABLED=1 / CRM_SYNC_AIRTABLE_ENABLED=1, and
 *   • the credentials are set (BREVO_API_KEY + BREVO_GDI_LIST_ID; AIRTABLE_API_KEY + AIRTABLE_BASE_ID).
 * Until then each function returns 'disabled' without any network call and the queue simply waits.
 *
 * When enabling (docs/crm/README.md → "Attivare le sincronizzazioni"): a worker (Supabase Edge Function on a database
 * webhook, or a Vercel cron) reads the pending rows, loads the record (view crm_brevo_contacts for Brevo), calls the
 * function below and records the outcome with crm_record_sync. Retries: failed rows stay 'failed' with attempts + 1.
 */
export type SyncOutcome = 'disabled' | 'synced' | 'skipped' | 'failed';

export const brevoSyncEnabled = () => process.env.CRM_SYNC_BREVO_ENABLED === '1' && !!brevoConfig() && !!process.env.BREVO_GDI_LIST_ID;
export const airtableSyncEnabled = () =>
  process.env.CRM_SYNC_AIRTABLE_ENABLED === '1' && !!process.env.AIRTABLE_API_KEY && !!process.env.AIRTABLE_BASE_ID;

// ─────────────────────────────────────────────────────────────
// Brevo
// ─────────────────────────────────────────────────────────────

/** One row of the view public.crm_brevo_contacts */
export interface BrevoContactRow {
  supabase_contact_id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  player_type: string | null;
  industry: string | null;
  country: string | null;
  interest_giveback: boolean;
  interest_ovb: boolean;
  interest_advisory: boolean;
  source_form: string;
  source_brand: string;
  newsletter_status: 'pending_confirmation' | 'subscribed' | 'unsubscribed' | null;
  in_newsletter_list: boolean;
}

/** Brevo contact attributes (docs/crm/brevo-mapping.csv). Empty values are left out, never sent as blanks. */
export function toBrevoAttributes(row: BrevoContactRow): Record<string, string | boolean> {
  const attrs: Record<string, string | boolean | null> = {
    SUPABASE_CONTACT_ID: row.supabase_contact_id,
    FIRSTNAME: row.firstname,
    LASTNAME: row.lastname,
    PLAYER_TYPE: row.player_type,
    INDUSTRY: row.industry,
    COUNTRY: row.country,
    INTEREST_GIVEBACK: row.interest_giveback,
    INTEREST_OVB: row.interest_ovb,
    INTEREST_ADVISORY: row.interest_advisory,
    SOURCE_FORM: row.source_form,
    SOURCE_BRAND: row.source_brand,
  };
  return Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== null && v !== '')) as Record<string, string | boolean>;
}

/**
 * Upserts the contact in Brevo. Only confirmed subscribers are ever created or added to "RM | Newsletter | Gocce di
 * Innovazione"; an unsubscribed contact is removed from that list, never deleted (Brevo keeps its own blocklist).
 * A contact who never confirmed is skipped.
 */
export async function syncContactToBrevo(row: BrevoContactRow): Promise<SyncOutcome> {
  if (!brevoSyncEnabled()) return 'disabled';
  const cfg = brevoConfig()!;
  const listId = Number(process.env.BREVO_GDI_LIST_ID);
  if (row.newsletter_status !== 'subscribed' && row.newsletter_status !== 'unsubscribed') {
    await dbRecordSync('contact', row.supabase_contact_id, 'brevo', 'skipped', null, 'not_confirmed');
    return 'skipped';
  }
  const body =
    row.newsletter_status === 'subscribed'
      ? { email: row.email, attributes: toBrevoAttributes(row), listIds: [listId], updateEnabled: true }
      : { email: row.email, attributes: toBrevoAttributes(row), unlinkListIds: [listId], updateEnabled: true };
  const res = await brevoPost('/contacts', body, cfg);
  // an existing contact is an update (updateEnabled); Brevo answers duplicate_parameter in some cases
  const ok = res.ok || res.code === 'duplicate_parameter';
  await dbRecordSync('contact', row.supabase_contact_id, 'brevo', ok ? 'synced' : 'failed', null, ok ? null : (res.ok ? null : res.reason));
  return ok ? 'synced' : 'failed';
}

/**
 * Brevo → Supabase unsubscribes (webhook "unsubscribed", to be configured in Brevo → Transactional/Marketing →
 * Webhooks). Prepared: app/api/webhooks/brevo/route.ts calls this only when the Brevo sync is enabled and the
 * request carries BREVO_WEBHOOK_SECRET. Returns the email to unsubscribe, or null if the event is not one.
 */
export function brevoUnsubscribeEmail(event: unknown): string | null {
  const e = event as { event?: unknown; email?: unknown };
  if (e?.event !== 'unsubscribed' || typeof e.email !== 'string') return null;
  const email = e.email.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254 ? email : null;
}

// ─────────────────────────────────────────────────────────────
// Airtable ("Rainmakers OS | CRM": an operational interface, not a second master database)
// ─────────────────────────────────────────────────────────────

/** Table names in the Airtable base (docs/crm/airtable-schema.md); every record carries `supabase_id` */
export const AIRTABLE_TABLES = {
  contact: 'Contacts',
  organization: 'Organizations',
  contact_organization: 'Contact Organizations',
  form_submission: 'Form Submissions',
  newsletter_subscription: 'Newsletter Subscriptions',
} as const;
type AirtableRecordType = keyof typeof AIRTABLE_TABLES;

/** Upsert on supabase_id: a second form from the same person updates, never duplicates */
async function upsertAirtable(type: AirtableRecordType, supabaseId: string, fields: Record<string, unknown>): Promise<SyncOutcome> {
  if (!airtableSyncEnabled()) return 'disabled';
  const base = process.env.AIRTABLE_BASE_ID!;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(AIRTABLE_TABLES[type])}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields: { supabase_id: supabaseId, ...fields } }], performUpsert: { fieldsToMergeOn: ['supabase_id'] }, typecast: true }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as { records?: { id: string }[] } | null;
    const externalId = json?.records?.[0]?.id ?? null;
    await dbRecordSync(type, supabaseId, 'airtable', res.ok ? 'synced' : 'failed', externalId, res.ok ? null : `http_${res.status}`);
    return res.ok ? 'synced' : 'failed';
  } catch {
    await dbRecordSync(type, supabaseId, 'airtable', 'failed', null, 'network_error');
    return 'failed';
  }
}

export interface AirtableContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  job_title: string | null;
  player_type: string | null;
  first_form_id: string;
  created_at: string;
}
export const syncContactToAirtable = (c: AirtableContact) =>
  upsertAirtable('contact', c.id, {
    Email: c.email,
    'First name': c.first_name,
    'Last name': c.last_name,
    Phone: c.phone,
    'Job title': c.job_title,
    'Player type': c.player_type,
    'First source form': c.first_form_id,
    'Created at': c.created_at,
  });

export interface AirtableOrganization {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  player_types: string[];
}
export const syncOrganizationToAirtable = (o: AirtableOrganization) =>
  upsertAirtable('organization', o.id, {
    Name: o.name,
    Website: o.website,
    Industry: o.industry,
    Country: o.country,
    City: o.city,
    'Player types': o.player_types,
  });

export interface AirtableSubmission {
  id: string;
  contact_id: string;
  organization_id: string | null;
  form_id: string;
  form_type: string;
  area: string | null;
  player_type: string | null;
  message: string | null;
  data: Record<string, unknown>;
  status: string;
  newsletter_opt_in: boolean;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  submitted_at: string;
}
export const syncSubmissionToAirtable = (s: AirtableSubmission) =>
  upsertAirtable('form_submission', s.id, {
    'Contact supabase_id': s.contact_id,
    'Organization supabase_id': s.organization_id,
    'Form id': s.form_id,
    'Form type': s.form_type,
    Area: s.area,
    'Player type': s.player_type,
    Message: s.message,
    Details: JSON.stringify(s.data),
    Status: s.status,
    'Newsletter opt-in': s.newsletter_opt_in,
    'Source page': s.source_page,
    'UTM source': s.utm_source,
    'UTM medium': s.utm_medium,
    'UTM campaign': s.utm_campaign,
    'Submitted at': s.submitted_at,
  });
