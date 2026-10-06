import { leadSchema, toFieldErrors } from '@/lib/validation';
import { storeLead } from '@/lib/leads-store';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_FILL_TIME_MS = 2500;
const MAX_BODY_BYTES = 16 * 1024;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients; other checks still apply
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403);

  const limited = rateLimit(`lead:${clientIp(req.headers)}`);
  if (!limited.ok) {
    return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(limited.retryAfter) });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'too_large' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Spam traps: pretend success so bots learn nothing.
  const b = body as { company_website_hp?: string; elapsedMs?: number };
  if (b?.company_website_hp || (typeof b?.elapsedMs === 'number' && b.elapsedMs < MIN_FILL_TIME_MS)) {
    return json({ ok: true });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', fields: toFieldErrors(parsed.error) }, 422);
  }

  const result = await storeLead(parsed.data);
  if (!result.ok) {
    const status = result.reason === 'rate_limited' ? 429 : 500;
    return json({ ok: false, error: result.reason }, status);
  }

  return json({ ok: true });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
