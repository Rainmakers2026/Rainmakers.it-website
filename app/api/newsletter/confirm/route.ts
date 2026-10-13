import { guard, json, readJson } from '@/lib/api/guard';
import { confirmSubscription, isTokenFormat } from '@/lib/brevo/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Double opt-in confirmation (POST from the confirmation page's button, never on link load, so that
 * mail-scanner prefetches cannot confirm on the person's behalf). On success: Supabase "confirmed",
 * contact added to the Brevo list "Contatti", welcome email sent once.
 */
export async function POST(request: Request) {
  const blocked = guard(request, 'newsletter-confirm');
  if (blocked) return blocked;
  const read = await readJson(request, 512);
  if (!read.ok) return read.response;
  const token = (read.body as { token?: unknown })?.token;
  if (!isTokenFormat(token)) return json({ ok: false, state: 'invalid' }, 400);

  const state = await confirmSubscription(token);
  if (state === 'error') return json({ ok: false, state }, 500);
  return json({ ok: state === 'confirmed' || state === 'already_confirmed', state });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
