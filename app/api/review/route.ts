import { reviewSchema, toFieldErrors } from '@/lib/validation';
import { markReviewNotified, submitReview } from '@/lib/supabase/leads';
import { notifyReview } from '@/lib/brevo/notify';
import { dbSubmit } from '@/lib/crm/db';
import { PRIVACY_VERSION, REVIEW_FORM, SOURCE_BRAND } from '@/lib/crm/forms';
import { guard, isBot, json, readJson } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * "Lascia una review" ("Dicono di noi" popup): validated server-side, stored in `reviews` (migration 0007) and,
 * since 2026-11-11, linked to the author's contact in the CRM (form_submissions, form type 'review', with the review id
 * only, the text stays in `reviews`); emailed to the team inbox (lib/brevo/notify.ts; reply-to = the author).
 * Never published automatically. Success when the database or the team inbox received it.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'review');
  if (blocked) return blocked;

  const read = await readJson(req, MAX_BODY_BYTES);
  if (!read.ok) return read.response;
  const body = read.body as { company_website_hp?: unknown; elapsedMs?: unknown };

  // Spam traps: pretend success so bots learn nothing.
  if (isBot(body?.company_website_hp, body?.elapsedMs)) return json({ ok: true });

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'validation', fields: toFieldErrors(parsed.error) }, 422);
  const r = parsed.data;

  const stored = await submitReview(r);
  if (!stored.ok && stored.reason !== 'not_configured') {
    return json({ ok: false, error: stored.reason }, stored.reason === 'rate_limited' ? 429 : 500);
  }
  // A retried submission (same idempotency key) was already handled: don't email twice.
  if (stored.ok && stored.duplicate) return json({ ok: true, duplicate: true });
  if (stored.ok && stored.mock) return json({ ok: true, mock: true });

  // The author in the CRM (best effort: the review itself is already stored) and the team inbox
  const space = r.name.indexOf(' ');
  const [, mail] = await Promise.all([
    stored.ok
      ? dbSubmit({
          idempotency_key: r.idempotencyKey,
          form_id: REVIEW_FORM.id,
          form_type: REVIEW_FORM.type,
          area: null,
          language: r.locale,
          source_brand: SOURCE_BRAND,
          source_page: null,
          utm: r.utm ?? {},
          privacy_version: PRIVACY_VERSION,
          contact: {
            email: r.email,
            first_name: space > 0 ? r.name.slice(0, space) : r.name,
            last_name: space > 0 ? r.name.slice(space + 1) : null,
            job_title: r.role ?? null,
          },
          organization: null,
          player_type: null,
          message: null,
          data: { review_id: stored.id, rating: r.rating ?? null, publish_consent: r.publishConsent === true },
          newsletter: { opt_in: false },
        })
      : null,
    notifyReview(r),
  ]);

  if (!stored.ok && !mail.ok) return json({ ok: false, error: 'not_configured' }, 500);
  if (stored.ok && stored.id && mail.ok) await markReviewNotified(stored.id);
  return json({ ok: true, stored: stored.ok, emailed: mail.ok });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
