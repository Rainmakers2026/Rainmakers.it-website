import 'server-only';
import { brevoConfig, brevoPost, type BrevoFailure } from './client';
import type { EmailContent } from './templates';

export type SendResult = { ok: true } | { ok: false; reason: BrevoFailure };

/**
 * Sends one transactional email through Brevo (/smtp/email). Transactional = it never adds the
 * recipient to a marketing list. Sender, name and reply-to come from the environment (PRD §11.3).
 */
/**
 * `replyTo` overrides BREVO_REPLY_TO (e.g. team notifications reply straight to the visitor).
 * `attachment`: files sent with the email, e.g. the pitch deck or CV in the team notification (base64).
 */
export async function sendTransactional(
  to: string,
  content: EmailContent,
  tag: string,
  opts: { replyTo?: string; attachment?: { name: string; content: string }[] } = {},
): Promise<SendResult> {
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
      ...(opts.attachment?.length ? { attachment: opts.attachment } : {}),
      tags: [tag],
    },
    cfg,
  );
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}
