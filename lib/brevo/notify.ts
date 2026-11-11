import 'server-only';
import type { ReviewSubmission } from '@/lib/validation';
import type { CrmForm } from '@/lib/crm/schema';
import { readableFields } from '@/lib/crm/readable';
import { sendTransactional, type SendResult } from './transactional';
import { joinNotificationEmail, newsletterSubscriberEmail, reviewNotificationEmail, type JoinKind } from './templates';

/**
 * Internal notifications (team requests 2026-10-23, 2026-10-27 and 2026-11-10), each overridable from the environment:
 *  - the "Come vuoi iniziare?" requests (the four cards) → JOIN_NOTIFY_EMAIL, default info@rainmakers.it
 *  - reviews → FORMS_NOTIFY_EMAIL, default tools@nuvolab.com
 *  - every confirmed newsletter subscription → NEWSLETTER_NOTIFY_EMAIL, default tools@nuvolab.com
 * Best effort: a failed notification is logged and never changes what the visitor is told.
 */
export const joinInbox = () => process.env.JOIN_NOTIFY_EMAIL || 'info@rainmakers.it';
export const formsInbox = () => process.env.FORMS_NOTIFY_EMAIL || 'tools@nuvolab.com';
export const newsletterInbox = () => process.env.NEWSLETTER_NOTIFY_EMAIL || 'tools@nuvolab.com';

/** A "Come vuoi iniziare?" request, with the PDF attached when there is one (≤ 4 MB, within Brevo's limits). */
const KIND: Record<CrmForm['form'], JoinKind> = { company: 'company', startup: 'pitch', invest: 'invest', giveback: 'giveback', job: 'cv' };

export async function notifyJoin(form: CrmForm, file: { name: string; bytes: Uint8Array } | null): Promise<SendResult> {
  const attachment = file ? [{ name: file.name, content: Buffer.from(file.bytes).toString('base64') }] : undefined;
  const sent = await sendTransactional(
    joinInbox(),
    joinNotificationEmail(KIND[form.form], readableFields(form), form.message, file),
    'join-team',
    { replyTo: form.email, attachment },
  );
  if (!sent.ok) console.error('[notify] join email not sent:', sent.reason);
  return sent;
}

export async function notifyReview(r: ReviewSubmission): Promise<SendResult> {
  const sent = await sendTransactional(
    formsInbox(),
    reviewNotificationEmail({
      name: r.name,
      email: r.email,
      company: r.company,
      role: r.role,
      rating: r.rating,
      review: r.review,
      publishConsent: r.publishConsent === true,
      locale: r.locale,
    }),
    'review',
    { replyTo: r.email },
  );
  if (!sent.ok) console.error('[notify] review email not sent:', sent.reason);
  return sent;
}

export async function notifyNewsletter(s: { email: string; locale?: string | null; source?: string | null }): Promise<SendResult> {
  const sent = await sendTransactional(newsletterInbox(), newsletterSubscriberEmail(s), 'newsletter-team');
  if (!sent.ok) console.error('[notify] newsletter email not sent:', sent.reason);
  return sent;
}
