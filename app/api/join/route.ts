import { randomUUID } from 'node:crypto';
import { crmFieldErrors, crmFormSchema, submissionData, type CrmErrorCode, type CrmForm } from '@/lib/crm/schema';
import { FORMS, PRIVACY_VERSION, SOURCE_BRAND } from '@/lib/crm/forms';
import { dbSubmit } from '@/lib/crm/db';
import { NEWSLETTER_CONSENT_VERSION } from '@/lib/options';
import { checkUploadMeta, isPdfSignature, maxUploadBytes, safeFileName, storagePath, MAX_UPLOAD_BYTES } from '@/lib/uploads';
import { deleteJoinDocument, uploadJoinDocument } from '@/lib/supabase/storage';
import { supabaseConfig } from '@/lib/supabase/rest';
import { notifyJoin } from '@/lib/brevo/notify';
import { newConfirmation, publicBaseUrl, sendConfirmation, sendWelcome, stateOf, type SubscribeState } from '@/lib/brevo/workflows';
import { guard, isBot, json } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** File (≤ 4 MB) + form fields; anything bigger is refused before parsing. */
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;
const devMock = () => process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1';

const invalid = (fields: Record<string, CrmErrorCode>) => json({ ok: false, error: 'validation', fields }, 422);

/** Page the request came from: the same-origin Referer path, else what the form says (validated), else none. */
function sourcePage(req: Request, fromForm: string | undefined): string | undefined {
  try {
    const ref = new URL(req.headers.get('referer') ?? '');
    if (ref.host === new URL(req.url).host && /^\/[A-Za-z0-9/_.-]*$/.test(ref.pathname)) return ref.pathname.slice(0, 300);
  } catch {
    // no or malformed Referer
  }
  return fromForm;
}

/**
 * "Come vuoi iniziare?" (2026-11-11): company, startup, investor, Giveback and job forms → the CRM "Rainmakers OS"
 * (supabase/migrations/0010_crm.sql → crm_submit). multipart/form-data: `payload` (JSON, lib/crm/schema.ts) + optional
 * `file` (PDF; pitch deck and CV only).
 * Order: validate → upload to the private bucket → one transaction in Supabase (contact, organisation, submission,
 * interests, consents, newsletter request) → on failure delete the upload → team email (info@rainmakers.it, PDF
 * attached) → acknowledgement to the visitor → newsletter confirmation email, only if the separate box was ticked.
 * Technical fields (form id and type, area, brand, privacy version) come from lib/crm/forms.ts, never from the browser.
 * Nothing is sent to Brevo lists or Airtable here: those syncs are prepared (lib/crm/sync.ts) but not active.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'join');
  if (blocked) return blocked;

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_REQUEST_BYTES) return json({ ok: false, error: 'too_large', fields: { file: 'fileTooLarge' } }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(String(form.get('payload') ?? ''));
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const b = body as { company_website_hp?: unknown; elapsedMs?: unknown };
  if (isBot(b?.company_website_hp, b?.elapsedMs)) return json({ ok: true });

  const parsed = crmFormSchema.safeParse(body);
  if (!parsed.success) return invalid(crmFieldErrors(parsed.error));
  const data: CrmForm = parsed.data;
  const def = FORMS[data.form];

  // File checks: declared metadata, size limit, then the real content signature (pitch deck and CV only)
  const entry = form.get('file');
  const file = def.document && entry instanceof File && entry.size > 0 ? entry : null;
  let bytes: Uint8Array | null = null;
  if (file) {
    const metaError = checkUploadMeta(file, maxUploadBytes());
    if (metaError) return invalid({ file: metaError });
    bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > maxUploadBytes()) return invalid({ file: 'fileTooLarge' });
    if (!isPdfSignature(bytes)) return invalid({ file: 'fileType' });
  }
  if (def.document && !file && !data.documentLink) return invalid({ file: 'fileOrLink' });

  const configured = !!supabaseConfig('service');
  let stored: { path: string; name: string; size: number } | null = null;
  if (file && bytes && configured) {
    const path = storagePath(def.document === 'pitch' ? 'pitch' : 'cv', randomUUID());
    const upload = await uploadJoinDocument(path, bytes);
    if (!upload.ok) return json({ ok: false, error: upload.reason }, 500);
    stored = { path, name: safeFileName(file.name), size: bytes.byteLength };
  }

  const confirmation = data.newsletterOptIn ? newConfirmation() : null;
  const result = configured
    ? await dbSubmit({
        idempotency_key: data.idempotencyKey,
        form_id: def.id,
        form_type: def.type,
        area: def.area,
        language: data.locale,
        source_brand: SOURCE_BRAND,
        source_page: sourcePage(req, data.sourcePage) ?? null,
        utm: data.utm,
        privacy_version: PRIVACY_VERSION,
        contact: { email: data.email, first_name: data.firstName, last_name: data.lastName, phone: data.phone ?? null, job_title: data.jobTitle ?? null },
        organization: def.player && data.organizationName
          ? { name: data.organizationName, website: data.organizationWebsite ?? null, industry: data.industry ?? null, country: data.country ?? null, city: data.city ?? null }
          : null,
        player_type: def.player ? (data.playerType ?? null) : null,
        message: data.message ?? null,
        data: submissionData(data),
        document: stored || data.documentLink ? { path: stored?.path ?? null, name: stored?.name ?? null, size: stored?.size ?? null, link: data.documentLink ?? null } : null,
        newsletter: {
          opt_in: data.newsletterOptIn,
          interests: data.editorialInterests,
          consent_version: NEWSLETTER_CONSENT_VERSION,
          token_hash: confirmation?.tokenHash ?? null,
          ttl_hours: confirmation?.ttlHours ?? null,
        },
      })
    : ({ ok: false, reason: 'not_configured' } as const);

  if (!result.ok) {
    if (stored) await deleteJoinDocument(stored.path);
    if (result.reason === 'rate_limited') return json({ ok: false, error: 'rate_limited' }, 429);
    if (result.reason === 'error') return json({ ok: false, error: 'error' }, 500);
    // Not configured: development accepts and logs; production still reaches the team by email, never pretends
    // to have stored the request
    const doc = file && bytes ? { name: safeFileName(file.name), bytes } : null;
    if (devMock()) {
      console.info('[join] Supabase not configured — mock mode, nothing stored');
      return json({ ok: true, duplicate: false, stored: false });
    }
    const mail = await notifyJoin(data, doc);
    return mail.ok ? json({ ok: true, duplicate: false, stored: false }) : json({ ok: false, error: 'not_configured' }, 500);
  }

  if (result.data.duplicate) {
    // Same request already recorded (double click / retry): drop the extra copy of the file, don't notify twice
    if (stored) await deleteJoinDocument(stored.path);
    return json({ ok: true, duplicate: true });
  }

  const baseUrl = publicBaseUrl(req);
  const doc = file && bytes ? { name: safeFileName(file.name), bytes } : null;
  // Team inbox and the visitor's acknowledgement; neither failure undoes a stored request (the daily job retries the latter)
  await Promise.all([notifyJoin(data, doc), sendWelcome('submission', result.data.submission_id, baseUrl)]);

  // Newsletter: double opt-in email only when the separate box was ticked
  let newsletter: SubscribeState | null = null;
  const n = result.data.newsletter;
  if (n && confirmation) {
    newsletter =
      stateOf(n.action) ??
      (await sendConfirmation({ subscriptionId: n.id, email: data.email, locale: data.locale, token: confirmation.token, baseUrl }));
  }
  return json({ ok: true, duplicate: false, newsletter });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
