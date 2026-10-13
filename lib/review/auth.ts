import 'server-only';

/**
 * Supabase Auth (GoTrue) for the internal annotation tool, over REST — no SDK, nothing in the browser.
 * Uses the ANON key only: privileges come from the signed-in user's JWT and RLS, never from the
 * service key. (Deliberately no fallback to SUPABASE_SERVICE_ROLE_KEY here.)
 */
export function anonConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: { id: string; email?: string };
}

type AuthResult<T> = { ok: true; data: T } | { ok: false; status: number };

async function authPost<T>(path: string, body: unknown, bearer?: string): Promise<AuthResult<T>> {
  const cfg = anonConfig();
  if (!cfg) return { ok: false, status: 0 };
  try {
    const res = await fetch(`${cfg.url}/auth/v1${path}`, {
      method: 'POST',
      headers: { apikey: cfg.key, 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (text ? JSON.parse(text) : {}) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Sends a one-time sign-in code. create_user: false → only users invited in the dashboard can sign in. */
export function sendSignInCode(email: string) {
  return authPost<unknown>('/otp', { email, create_user: false });
}

export function verifySignInCode(email: string, token: string) {
  return authPost<AuthTokens>('/verify', { type: 'email', email, token });
}

export function refreshSession(refreshToken: string) {
  return authPost<AuthTokens>('/token?grant_type=refresh_token', { refresh_token: refreshToken });
}

export function signOut(accessToken: string) {
  return authPost<unknown>('/logout', {}, accessToken);
}

/** PostgREST request as the signed-in user (RLS applies). */
export async function asUser(accessToken: string, path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const cfg = anonConfig();
  if (!cfg) return { ok: false as const, status: 0, data: null as unknown };
  try {
    const res = await fetch(`${cfg.url}/rest/v1${path}`, {
      method: init.method ?? 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false as const, status: 0, data: null as unknown };
  }
}
