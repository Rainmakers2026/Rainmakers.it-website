import 'server-only';

/**
 * Minimal Supabase REST client (PostgREST) — no SDK needed for two calls.
 * Keys are read server-side only and never reach the browser.
 */
export function supabaseConfig(kind: 'service' | 'public') {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key =
    kind === 'service'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export function authHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    // Legacy keys are JWTs and also go in Authorization; new sb_publishable_/sb_secret_ keys only as apikey.
    ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
  };
}

export type RpcResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

/**
 * Calls a Postgres function with the service key (server only). Errors carry the HTTP status and the
 * Postgres message, never the arguments (which may contain personal data).
 */
export async function rpcCall<T>(fn: string, args: Record<string, unknown>): Promise<RpcResult<T>> {
  const cfg = supabaseConfig('service');
  if (!cfg) return { ok: false, status: 0, message: 'not_configured' };
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, message: text.slice(0, 300) };
    return { ok: true, data: (text ? JSON.parse(text) : null) as T };
  } catch {
    return { ok: false, status: 0, message: 'network_error' };
  }
}
