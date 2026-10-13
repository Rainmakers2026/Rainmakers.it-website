import { timingSafeEqual } from 'node:crypto';
import { json } from '@/lib/api/guard';
import { retryPending } from '@/lib/brevo/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Constant-time comparison of the Authorization header with "Bearer <CRON_SECRET>". */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily retry job (vercel.json → crons). Vercel sends "Authorization: Bearer $CRON_SECRET".
 * Retries confirmed subscribers not yet in the Brevo list "Contatti" and welcome emails that failed.
 * It never sends confirmation emails or contacts anyone without consent.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return json({ ok: false, error: 'unauthorized' }, 401);
  const result = await retryPending();
  return json(result, result.ok ? 200 : 500);
}
