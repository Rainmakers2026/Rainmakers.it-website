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
