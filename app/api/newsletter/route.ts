import { gdiNewsletterSchema } from '@/lib/crm/schema';
import { guard, isBot, json, readJson } from '@/lib/api/guard';
import { publicBaseUrl, requestSubscription } from '@/lib/brevo/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 4096;

/**
 * "Gocce di Innovazione", the only newsletter (2026-11-11), with double opt-in:
 * validate → contact + newsletter_subscriptions 'pending_confirmation' + editorial interests + consent event in Supabase
 * → confirmation email. Nobody is added to a Brevo list here (the Brevo sync is prepared, not active).
 */
export async function POST(request: Request) {
  const blocked = guard(request, 'newsletter');
  if (blocked) return blocked;

  const read = await readJson(request, MAX_BODY_BYTES);
  if (!read.ok) return read.response;
  const body = read.body as { website?: unknown; elapsedMs?: unknown };
  // Spam traps: look like a normal request, store and send nothing
  if (isBot(body?.website, body?.elapsedMs)) return json({ ok: true, state: 'pending' });

  const parsed = gdiNewsletterSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, state: 'error', error: 'validation' }, 422);
  const d = parsed.data;

  const state = await requestSubscription({
    email: d.email,
    firstName: d.firstName,
    interests: d.interests,
    locale: d.locale,
    source: d.source,
    sourcePage: d.sourcePage,
    utm: d.utm,
    baseUrl: publicBaseUrl(request),
  });
  if (state === 'error') return json({ ok: false, state }, 500);
  // Saved, but the confirmation email failed: honest answer, the visitor can retry later
  if (state === 'email_failed') return json({ ok: false, state }, 503);
  return json({ ok: true, state });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
