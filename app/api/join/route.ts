import { randomUUID } from 'node:crypto';
import { joinSchema, toFieldErrors, type JoinErrorCode } from '@/lib/validation';
import { checkUploadMeta, isPdfSignature, maxUploadBytes, safeFileName, storagePath, MAX_UPLOAD_BYTES } from '@/lib/uploads';
import { submitJoinApplication } from '@/lib/supabase/leads';
import { deleteJoinDocument, uploadJoinDocument } from '@/lib/supabase/storage';
import { supabaseConfig } from '@/lib/supabase/rest';
import { syncLeadToAirtable } from '@/lib/airtable/leads';
import { sendWelcome } from '@/lib/brevo/workflows';
import { guard, isBot, json } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** File (≤ 4 MB) + form fields; anything bigger is refused before parsing. */
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

const invalid = (fields: Record<string, JoinErrorCode>) => json({ ok: false, error: 'validation', fields }, 422);

/**
 * "Join the Tribe" — pitch or CV (PRD §10.2, §10.4).
 * multipart/form-data: `payload` (JSON, validated with joinSchema) + optional `file` (PDF).
 * Order: validate everything → upload to the private bucket → insert the row → on failure delete the upload.
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

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return invalid(toFieldErrors(parsed.error));
  const data = parsed.data;

  // File checks: declared metadata, size limit, then the real content signature
  const entry = form.get('file');
  const file = entry instanceof File && entry.size > 0 ? entry : null;
  let bytes: Uint8Array | null = null;
  if (file) {
    const metaError = checkUploadMeta(file, maxUploadBytes());
    if (metaError) return invalid({ file: metaError });
    bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > maxUploadBytes()) return invalid({ file: 'fileTooLarge' });
    if (!isPdfSignature(bytes)) return invalid({ file: 'fileType' });
  }
  if (!file && !data.link) return invalid({ file: 'fileOrLink' });

  // Upload first (unpredictable path), then record it
  let stored: { path: string; name: string; size: number } | null = null;
  if (file && bytes) {
    if (!supabaseConfig('service') && (process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1')) {
      console.info('[join] Supabase not configured — mock mode, file not stored');
    } else {
      const path = storagePath(data.submissionType, randomUUID());
      const upload = await uploadJoinDocument(path, bytes);
      if (!upload.ok) return json({ ok: false, error: upload.reason }, 500);
      stored = { path, name: safeFileName(file.name), size: bytes.byteLength };
    }
  }

  const result = await submitJoinApplication(data, stored);
  if (!result.ok) {
    if (stored) await deleteJoinDocument(stored.path);
    return json({ ok: false, error: result.reason }, result.reason === 'rate_limited' ? 429 : 500);
  }
  if (result.duplicate) {
    // Same submission already recorded (double click / retry): drop the extra copy of the file
    if (stored) await deleteJoinDocument(stored.path);
    return json({ ok: true, duplicate: true });
  }

  // Optional Airtable mirror (existing integration); its status is internal and never blocks the visitor
  await syncLeadToAirtable(data);
  // "Application received" email (transactional, no list), at most once per application; failures are retried by the cron
  if (result.id) await sendWelcome('join', result.id);
  return json({ ok: true, duplicate: false });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
