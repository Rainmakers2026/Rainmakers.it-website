import { guard, json, readJson } from '@/lib/api/guard';
import { verifyUnsubscribe } from '@/lib/crm/links';
import { dbUnsubscribe } from '@/lib/crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Unsubscribe from "Gocce di Innovazione" (POST from /{locale}/newsletter/unsubscribe, after a click on the button, so
 * that link scanners cannot unsubscribe anyone). The link is signed per contact (lib/crm/links.ts); a wrong or
 * missing signature is refused without touching the database. The preference is recorded in Supabase with a
 * 'withdrawn' consent event and queued for Brevo.
 */
export async function POST(request: Request) {
  const blocked = guard(request, 'newsletter-unsubscribe');
  if (blocked) return blocked;
  const read = await readJson(request, 512);
  if (!read.ok) return read.response;
  const { c, t } = (read.body ?? {}) as { c?: unknown; t?: unknown };
  if (!verifyUnsubscribe(c, t)) return json({ ok: false, state: 'invalid' }, 400);

  const db = await dbUnsubscribe(c, 'email_link');
  if (!db.ok) return json({ ok: false, state: 'error' }, db.reason === 'not_configured' ? 503 : 500);
  const state = db.data.action === 'not_found' ? 'invalid' : db.data.action;
  return json({ ok: state !== 'invalid', state });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
