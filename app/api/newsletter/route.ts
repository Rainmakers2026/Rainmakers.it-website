import { newsletterSchema } from '@/lib/validation';
import { guard, isBot, json, readJson } from '@/lib/api/guard';
import { publicBaseUrl, requestSubscription } from '@/lib/brevo/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 4096;

/**
 * Newsletter subscription with double opt-in (PRD §11.1):
 * validate → save in Supabase as "pending" with consent evidence → send the confirmation email (Brevo).
 * The contact is added to the Brevo list "Contatti" only after confirmation (POST /api/newsletter/confirm).
 */
export async function POST(request: Request) {
  const blocked = guard(request, 'newsletter');
  if (blocked) return blocked;

  const read = await readJson(request, MAX_BODY_BYTES);
  if (!read.ok) return read.response;
  const body = read.body as { website?: unknown; elapsedMs?: unknown };
  // Spam traps: look like a normal request, store and send nothing
  if (isBot(body?.website, body?.elapsedMs)) return json({ ok: true, state: 'pending' });

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, state: 'error', error: 'validation' }, 422);

  const state = await requestSubscription({
    email: parsed.data.email,
    locale: parsed.data.locale,
    source: parsed.data.source,
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
