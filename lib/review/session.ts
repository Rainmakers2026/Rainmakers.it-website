import 'server-only';
import { asUser, refreshSession, type AuthTokens } from './auth';

/**
 * Team session for the annotation tool, kept in httpOnly cookies scoped to /api:
 * page JavaScript can never read the tokens, and they are only sent to our own API routes.
 */
const ACCESS = 'rm_rev_at';
const REFRESH = 'rm_rev_rt';
const EXPIRES = 'rm_rev_exp';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 14; // 14 days, then sign in again

function serialize(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookies(t: AuthTokens): string[] {
  const expiresAt = Math.floor(Date.now() / 1000) + (t.expires_in || 3600);
  return [
    serialize(ACCESS, t.access_token, t.expires_in || 3600),
    serialize(REFRESH, t.refresh_token, REFRESH_MAX_AGE),
    serialize(EXPIRES, String(expiresAt), REFRESH_MAX_AGE),
  ];
}

export const clearSessionCookies = () => [serialize(ACCESS, '', 0), serialize(REFRESH, '', 0), serialize(EXPIRES, '', 0)];

export type Session = { accessToken: string; setCookies: string[] };

/**
 * Returns the caller's access token, refreshing it when it is (about to be) expired.
 * Null when there is no session — the caller answers 401. Validity and membership are enforced by
 * Supabase (JWT verification + RLS) on every request.
 */
export async function getSession(req: Request): Promise<Session | null> {
  const c = parseCookies(req);
  if (!c[REFRESH]) return null;
  const expiresAt = Number(c[EXPIRES] || 0);
  if (c[ACCESS] && expiresAt - 60 > Date.now() / 1000) return { accessToken: c[ACCESS], setCookies: [] };
  const refreshed = await refreshSession(c[REFRESH]);
  if (!refreshed.ok) return null;
  return { accessToken: refreshed.data.access_token, setCookies: sessionCookies(refreshed.data) };
}

export type Membership = { email: string; role: 'editor' | 'admin' };

/** The caller's own team_members row (RLS lets a user read only their own row). */
export async function getMembership(accessToken: string): Promise<{ ok: true; member: Membership | null } | { ok: false; status: number }> {
  const r = await asUser(accessToken, '/team_members?select=email,role');
  if (!r.ok) return { ok: false, status: r.status };
  const rows = Array.isArray(r.data) ? (r.data as Membership[]) : [];
  return { ok: true, member: rows[0] ?? null };
}

/** JSON response with optional Set-Cookie headers. */
export function respond(body: unknown, status = 200, cookies: string[] = []) {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(JSON.stringify(body), { status, headers });
}
