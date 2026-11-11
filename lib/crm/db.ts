import 'server-only';
import type { Locale } from '@/content/types';
import { rpcCall } from '@/lib/supabase/rest';

/**
 * CRM persistence (supabase/migrations/0010_crm.sql). Supabase is the source of truth; every call goes through a
 * SECURITY DEFINER function with the service key. Errors are logged with the status only, never the payload.
 */
export type DbFailure = { ok: false; reason: 'not_configured' | 'rate_limited' | 'error' };
export type DbResult<T> = { ok: true; data: T } | DbFailure;

function failure(fn: string, status: number, message: string): DbFailure {
  if (status === 0 && message === 'not_configured') return { ok: false, reason: 'not_configured' };
  if (/rate_limited/.test(message)) return { ok: false, reason: 'rate_limited' };
  console.error(`[crm] ${fn} failed`, status);
  return { ok: false, reason: 'error' };
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<DbResult<T>> {
  const r = await rpcCall<T>(fn, args);
  return r.ok ? { ok: true, data: r.data } : failure(fn, r.status, r.message);
}

export type NewsletterAction = 'send_confirmation' | 'confirmation_recent' | 'already_subscribed';

export interface SubmitResult {
  contact_id: string;
  organization_id: string | null;
  submission_id: string;
  duplicate: boolean;
  newsletter: { id: string; action: NewsletterAction } | null;
}

/** crm_submit: contact, organisation, submission, interests, consents and newsletter request in one transaction */
export const dbSubmit = (p: Record<string, unknown>) => call<SubmitResult>('crm_submit', { p });

export const dbNewsletterSubscribe = (p: Record<string, unknown>) => call<{ id: string; action: NewsletterAction }>('crm_newsletter_subscribe', { p });

export async function dbRecordConfirmation(id: string, ok: boolean) {
  const r = await rpcCall('crm_newsletter_record_confirmation', { p_id: id, p_ok: ok });
  if (!r.ok) console.error('[crm] record_confirmation failed', r.status);
}

export type ConfirmAction = 'confirmed' | 'already_confirmed' | 'expired' | 'invalid';
export interface ConfirmResult {
  action: ConfirmAction;
  id?: string;
  contact_id?: string;
  email?: string;
  language?: Locale;
  needs_welcome?: boolean;
}
export const dbConfirm = (tokenHash: string) => call<ConfirmResult>('crm_newsletter_confirm', { p_token_hash: tokenHash });

export const dbUnsubscribe = (contactId: string, source: string) =>
  call<{ action: 'unsubscribed' | 'already' | 'not_found' }>('crm_newsletter_unsubscribe', { p_contact: contactId, p_source: source });

/** Unsubscribe received from Brevo (by email) */
export const dbUnsubscribeEmail = (email: string, source: string) =>
  call<{ action: 'unsubscribed' | 'already' | 'not_found' }>('crm_newsletter_unsubscribe_email', { p_email: email, p_source: source });

export interface AckClaim {
  email?: string;
  first_name?: string | null;
  language?: Locale;
  form_type?: string;
  contact_id?: string;
}
/** Atomic claim: the recipient for the first caller only, {} afterwards */
export async function dbClaimAck(kind: 'submission' | 'newsletter', id: string): Promise<AckClaim | null> {
  const r = await rpcCall<AckClaim>('crm_claim_ack', { p_kind: kind, p_id: id });
  if (!r.ok) {
    console.error('[crm] claim_ack failed', r.status);
    return null;
  }
  return r.data?.email ? r.data : null;
}

export async function dbFinishAck(kind: 'submission' | 'newsletter', id: string, ok: boolean) {
  const r = await rpcCall('crm_finish_ack', { p_kind: kind, p_id: id, p_ok: ok });
  if (!r.ok) console.error('[crm] finish_ack failed', r.status);
}

export const dbPendingEmails = () => call<{ submissions: string[]; newsletter: string[] }>('crm_pending_emails', {});

export async function dbRecordSync(
  type: 'contact' | 'organization' | 'contact_organization' | 'form_submission' | 'newsletter_subscription',
  id: string,
  destination: 'brevo' | 'airtable',
  status: 'synced' | 'failed' | 'skipped',
  externalId: string | null,
  error: string | null,
) {
  const r = await rpcCall('crm_record_sync', {
    p_type: type,
    p_id: id,
    p_destination: destination,
    p_status: status,
    p_external_id: externalId,
    p_error: error,
  });
  if (!r.ok) console.error('[crm] record_sync failed', r.status);
}
