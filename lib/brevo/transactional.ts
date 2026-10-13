import 'server-only';
import { brevoConfig, brevoPost, type BrevoFailure } from './client';
import type { EmailContent } from './templates';

export type SendResult = { ok: true } | { ok: false; reason: BrevoFailure };

/**
 * Sends one transactional email through Brevo (/smtp/email). Transactional = it never adds the
 * recipient to a marketing list. Sender, name and reply-to come from the environment (PRD §11.3).
 */
/** `replyTo` overrides BREVO_REPLY_TO (e.g. team notifications reply straight to the visitor). */
export async function sendTransactional(to: string, content: EmailContent, tag: string, opts: { replyTo?: string } = {}): Promise<SendResult> {
  const cfg = brevoConfig();
  if (!cfg) return { ok: false, reason: 'not_configured' };
  const res = await brevoPost(
    '/smtp/email',
    {
      sender: cfg.from,
      to: [{ email: to }],
      ...(opts.replyTo || cfg.replyTo ? { replyTo: { email: opts.replyTo || cfg.replyTo } } : {}),
      subject: content.subject,
      htmlContent: content.html,
      textContent: content.text,
      tags: [tag],
    },
    cfg,
  );
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}
