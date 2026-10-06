/**
 * Best-effort, in-memory sliding-window limiter (per serverless instance).
 * It stops bursts from a single client; a per-email limit is also enforced in the
 * database (see submit_lead in supabase/migrations). For stronger guarantees across
 * instances, swap this for Upstash Redis or Vercel Firewall rate-limiting rules.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    // keep memory bounded
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return { ok: true as const };
}

export function clientIp(headers: Headers) {
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
