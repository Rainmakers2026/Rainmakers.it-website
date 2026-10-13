import 'server-only';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/** Spam traps: forms filled faster than this are treated as bots (fake success, nothing stored). */
export const MIN_FILL_TIME_MS = 2500;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

/** Browser requests must come from this site (CSRF-style protection for the form endpoints). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients; the other checks still apply
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Origin + per-IP burst limit shared by the form routes. Returns a response to send, or null to continue. */
export function guard(req: Request, scope: string, limit?: { max: number; windowMs: number }): Response | null {
  if (!sameOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403);
  const limited = rateLimit(`${scope}:${clientIp(req.headers)}`, limit?.max, limit?.windowMs);
  if (!limited.ok) return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(limited.retryAfter) });
  return null;
}

/** Reads a JSON body with a size cap. */
export async function readJson(req: Request, maxBytes: number): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const raw = await req.text();
  if (raw.length > maxBytes) return { ok: false, response: json({ ok: false, error: 'too_large' }, 413) };
  try {
    return { ok: true, body: JSON.parse(raw) };
  } catch {
    return { ok: false, response: json({ ok: false, error: 'invalid_json' }, 400) };
  }
}

export const isBot = (honeypot: unknown, elapsedMs: unknown) =>
  (typeof honeypot === 'string' && honeypot.length > 0) || (typeof elapsedMs === 'number' && elapsedMs < MIN_FILL_TIME_MS);
