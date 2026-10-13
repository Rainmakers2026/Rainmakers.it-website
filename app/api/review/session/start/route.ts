import { z } from 'zod';
import { guard, json, readJson } from '@/lib/api/guard';
import { anonConfig, sendSignInCode } from '@/lib/review/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().trim().toLowerCase().max(254).email() });

/**
 * Team sign-in, step 1: emails a one-time code (Supabase Auth). Only users already invited in the
 * Supabase dashboard can receive one (create_user: false). The answer is identical whether or not the
 * address exists, so the endpoint cannot be used to discover team members.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'review-start', { max: 5, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const read = await readJson(req, 1024);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.body);
  if (!parsed.success) return json({ ok: false, error: 'validation' }, 422);
  await sendSignInCode(parsed.data.email); // outcome deliberately not disclosed
  return json({ ok: true });
}
