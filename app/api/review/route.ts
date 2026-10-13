import { reviewSchema, toFieldErrors } from '@/lib/validation';
import { markReviewNotified, submitReview } from '@/lib/supabase/leads';
import { sendTransactional } from '@/lib/brevo/transactional';
import { reviewNotificationEmail } from '@/lib/brevo/templates';
import { guard, isBot, json, readJson } from '@/lib/api/guard';
import { facts } from '@/content/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * "Lascia una review" ("Dicono di noi" popup): validated server-side, stored in `reviews` (migration 0007)
 * and emailed to info@rainmakers.it via Brevo (reply-to = the author). Never published automatically.
 * Success when at least one destination received it: the database, or the team inbox.
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

  const mail = await sendTransactional(
    facts.contactEmail.value,
    reviewNotificationEmail({
      name: r.name,
      email: r.email,
      company: r.company,
      role: r.role,
      rating: r.rating,
      review: r.review,
      publishConsent: r.publishConsent === true,
      locale: r.locale,
    }),
    'review',
    { replyTo: r.email },
  );
  if (!mail.ok) console.error('[review] team email not sent:', mail.reason);

  if (!stored.ok && !mail.ok) return json({ ok: false, error: 'not_configured' }, 500);
  if (stored.ok && stored.id && mail.ok) await markReviewNotified(stored.id);
  return json({ ok: true, stored: stored.ok, emailed: mail.ok });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
