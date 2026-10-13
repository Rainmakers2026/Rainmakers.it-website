import { z } from 'zod';
import { guard, json, readJson } from '@/lib/api/guard';
import { anonConfig, signOut, verifySignInCode } from '@/lib/review/auth';
import { getMembership, respond, sessionCookies } from '@/lib/review/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  code: z.string().trim().regex(/^\d{6,10}$/),
});

/**
 * Team sign-in, step 2: verifies the code, then checks the team allowlist (team_members) with the
 * user's own token. Signed-in users who are not team members get no session cookie at all.
 * Tokens go only into httpOnly cookies (Path=/api); the response body never contains them.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'review-verify', { max: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const read = await readJson(req, 1024);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.body);
  if (!parsed.success) return json({ ok: false, error: 'validation' }, 422);

  const verified = await verifySignInCode(parsed.data.email, parsed.data.code);
  if (!verified.ok) return json({ ok: false, error: 'invalid_code' }, 401);

  const membership = await getMembership(verified.data.access_token);
  if (!membership.ok || !membership.member) {
    await signOut(verified.data.access_token);
    return json({ ok: false, error: 'not_team' }, 403);
  }
  return respond({ ok: true, email: membership.member.email, role: membership.member.role }, 200, sessionCookies(verified.data));
}
