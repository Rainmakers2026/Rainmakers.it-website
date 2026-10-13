import { guard, json } from '@/lib/api/guard';
import { anonConfig, signOut } from '@/lib/review/auth';
import { clearSessionCookies, getMembership, getSession, respond } from '@/lib/review/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = { max: 120, windowMs: 10 * 60 * 1000 };

/** Who am I? 200 with email/role for team members; 401 without a valid session; 403 if not (or no longer) in the team. */
export async function GET(req: Request) {
  const blocked = guard(req, 'review-session', LIMIT);
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const session = await getSession(req);
  if (!session) return respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies());
  const membership = await getMembership(session.accessToken);
  if (!membership.ok) {
    return membership.status === 401
      ? respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies())
      : respond({ ok: false, error: 'error' }, 500, session.setCookies);
  }
  if (!membership.member) return respond({ ok: false, error: 'not_team' }, 403, clearSessionCookies());
  return respond({ ok: true, email: membership.member.email, role: membership.member.role }, 200, session.setCookies);
}

/** Sign out: revokes the Supabase session and clears the cookies. */
export async function DELETE(req: Request) {
  const blocked = guard(req, 'review-session', LIMIT);
  if (blocked) return blocked;
  const session = anonConfig() ? await getSession(req) : null;
  if (session) await signOut(session.accessToken);
  return respond({ ok: true }, 200, clearSessionCookies());
}
