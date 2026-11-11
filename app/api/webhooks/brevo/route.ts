import { timingSafeEqual } from 'node:crypto';
import { json } from '@/lib/api/guard';
import { brevoSyncEnabled, brevoUnsubscribeEmail } from '@/lib/crm/sync';
import { dbUnsubscribeEmail } from '@/lib/crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Brevo → Supabase unsubscribes (PREPARED, NOT ACTIVE). Answers 404 until the Brevo sync is enabled
 * (CRM_SYNC_BREVO_ENABLED=1 + credentials) and BREVO_WEBHOOK_SECRET is set; Brevo must then call
 * /api/webhooks/brevo?secret=<BREVO_WEBHOOK_SECRET> for the "unsubscribed" event.
 * The unsubscribe is recorded in Supabase (status, 'withdrawn' consent event, source 'brevo'); an address Supabase does
 * not know is ignored. Until the switch is on, nothing is read or written.
 */
export async function POST(req: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!brevoSyncEnabled() || !secret) return json({ ok: false, error: 'not_found' }, 404);
  const given = Buffer.from(new URL(req.url).searchParams.get('secret') ?? '');
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return json({ ok: false, error: 'unauthorized' }, 401);

  const event = await req.json().catch(() => null);
  const email = brevoUnsubscribeEmail(event);
  if (!email) return json({ ok: true, ignored: true });
  const db = await dbUnsubscribeEmail(email, 'brevo');
  return db.ok ? json({ ok: true, state: db.data.action }) : json({ ok: false, error: 'error' }, 500);
}
