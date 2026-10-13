import 'server-only';
import { brevoConfig, brevoPost, type BrevoFailure } from './client';
import type { EmailContent } from './templates';

export type SendResult = { ok: true } | { ok: false; reason: BrevoFailure };

/**
 * Sends one transactional email through Brevo (/smtp/email). Transactional = it never adds the
 * recipient to a marketing list. Sender, name and reply-to come from the environment (PRD §11.3).
 */
export async function sendTransactional(to: string, content: EmailContent, tag: string): Promise<SendResult> {
  const cfg = brevoConfig();
  if (!cfg) return { ok: false, reason: 'not_configured' };
  const res = await brevoPost(
    '/smtp/email',
    {
      sender: cfg.from,
      to: [{ email: to }],
      ...(cfg.replyTo ? { replyTo: { email: cfg.replyTo } } : {}),
      subject: content.subject,
      htmlContent: content.html,
      textContent: content.text,
      tags: [tag],
    },
    cfg,
  );
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}
