import { contactSchema, toFieldErrors } from '@/lib/validation';
import { submitContact } from '@/lib/supabase/leads';
import { guard, isBot, json, readJson } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * "Connettiti con Rainmakers" (PRD §10.2, §11.2): validated server-side, stored in contact_requests.
 * Not a newsletter subscription: nothing here is sent to the marketing list.
 * Join the Tribe uses /api/join.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'lead');
  if (blocked) return blocked;

  const read = await readJson(req, MAX_BODY_BYTES);
  if (!read.ok) return read.response;
  const body = read.body as { company_website_hp?: unknown; elapsedMs?: unknown };

  // Spam traps: pretend success so bots learn nothing.
  if (isBot(body?.company_website_hp, body?.elapsedMs)) return json({ ok: true });

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'validation', fields: toFieldErrors(parsed.error) }, 422);

  const result = await submitContact(parsed.data);
  if (!result.ok) return json({ ok: false, error: result.reason }, result.reason === 'rate_limited' ? 429 : 500);
  return json({ ok: true, duplicate: result.duplicate });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
