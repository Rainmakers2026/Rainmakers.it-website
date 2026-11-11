import 'server-only';

/**
 * Brevo HTTP API (approved approach D14: one API key, no SMTP library).
 * Credentials are read here only, server-side; nothing is ever prefixed NEXT_PUBLIC_.
 */
export const BREVO_API = 'https://api.brevo.com/v3';

export interface BrevoConfig {
  apiKey: string;
  from: { email: string; name: string };
  replyTo: string | null;
}

export function brevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  return {
    apiKey,
    from: { email: fromEmail, name: process.env.BREVO_FROM_NAME || 'Rainmakers' },
    replyTo: process.env.BREVO_REPLY_TO || null,
  };
}

export type BrevoFailure = 'not_configured' | 'rate_limited' | 'invalid' | 'unauthorized' | 'error';
export type BrevoResult = { ok: true; status: number; body: unknown } | { ok: false; reason: BrevoFailure; status: number; code?: string };

/** POST to the Brevo API with a timeout. Logs status/code only — no addresses or message content. */
export async function brevoPost(path: string, payload: unknown, cfg: BrevoConfig): Promise<BrevoResult> {
  try {
    const res = await fetch(`${BREVO_API}${path}`, {
      method: 'POST',
      headers: { 'api-key': cfg.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (res.ok) return { ok: true, status: res.status, body };
    const code = typeof (body as { code?: unknown })?.code === 'string' ? (body as { code: string }).code : undefined;
    const reason: BrevoFailure = res.status === 429 ? 'rate_limited' : res.status === 401 || res.status === 403 ? 'unauthorized' : res.status === 400 ? 'invalid' : 'error';
    console.error(`[brevo] ${path} failed`, res.status, code ?? '');
    return { ok: false, reason, status: res.status, code };
  } catch {
    console.error(`[brevo] ${path} network error or timeout`);
    return { ok: false, reason: 'error', status: 0 };
  }
}
