import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { Locale } from '@/content/types';
import type { Area } from '@/lib/crm/taxonomy';
import { NEWSLETTER_FORM, PRIVACY_VERSION } from '@/lib/crm/forms';
import { NEWSLETTER_CONSENT_VERSION } from '@/lib/options';
import { supabaseConfig } from '@/lib/supabase/rest';
import { dbClaimAck, dbConfirm, dbFinishAck, dbNewsletterSubscribe, dbPendingEmails, dbRecordConfirmation, type NewsletterAction } from '@/lib/crm/db';
import { unsubscribeUrl } from '@/lib/crm/links';
import { brevoConfig } from './client';
import { sendTransactional } from './transactional';
import { confirmationEmail, joinReceivedEmail, newsletterWelcomeEmail, type JoinKind } from './templates';
import { notifyNewsletter } from './notify';

/**
 * Email workflows on top of the CRM (supabase/migrations/0010_crm.sql), 2026-11-11.
 * Only transactional emails leave from here: the double opt-in confirmation, the welcome after confirmation and the
 * acknowledgement of a request. Nobody is added to a Brevo list from here: that is the job of the Brevo sync
 * (lib/crm/sync.ts), prepared but not active.
 */
export const CONFIRM_TTL_HOURS = 48;
const devMock = () => process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
/** 256-bit random token, URL-safe; only its hash is stored in the database. */
export const newToken = () => randomBytes(32).toString('base64url');
export const isTokenFormat = (t: unknown): t is string => typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t);

/**
 * Visitor-facing outcome of a newsletter request:
 *  pending        confirmation email sent — check your inbox
 *  pending_recent a confirmation was sent minutes ago — not sent again
 *  already        already a confirmed subscriber — nothing sent
 *  email_failed   request saved, but the confirmation email could not be sent (retry later)
 *  error          not saved
 */
export type SubscribeState = 'pending' | 'pending_recent' | 'already' | 'email_failed' | 'error';

/** A fresh token: the hash goes to the database, the token itself only into the email. */
export function newConfirmation() {
  const token = newToken();
  return { token, tokenHash: hashToken(token), ttlHours: CONFIRM_TTL_HOURS };
}

/** Sends the double opt-in email for a subscription the database has just marked 'send_confirmation'. */
export async function sendConfirmation(input: { subscriptionId: string; email: string; locale: Locale; token: string; baseUrl: string }): Promise<SubscribeState> {
  const url = `${input.baseUrl}/${input.locale}/newsletter/confirm?token=${input.token}`;
  if (!brevoConfig()) {
    await dbRecordConfirmation(input.subscriptionId, false);
    if (devMock()) {
      console.info('[newsletter] Brevo not configured — mock mode, confirmation email not sent');
      return 'pending';
    }
    console.error('[newsletter] Brevo not configured — confirmation email not sent');
    return 'email_failed';
  }
  const sent = await sendTransactional(input.email, confirmationEmail(input.locale, url, CONFIRM_TTL_HOURS), 'newsletter-confirmation');
  await dbRecordConfirmation(input.subscriptionId, sent.ok);
  return sent.ok ? 'pending' : 'email_failed';
}

export const stateOf = (action: NewsletterAction): SubscribeState | null =>
  action === 'already_subscribed' ? 'already' : action === 'confirmation_recent' ? 'pending_recent' : null;

/** Dedicated "Gocce di Innovazione" form: saved as pending_confirmation with its consent event, then the email. */
export async function requestSubscription(input: {
  email: string;
  firstName?: string;
  interests: Area[];
  locale: Locale;
  source?: string;
  sourcePage?: string;
  utm: Record<string, string>;
  baseUrl: string;
}): Promise<SubscribeState> {
  if (!supabaseConfig('service')) {
    if (devMock()) {
      console.info('[newsletter] Supabase not configured — mock mode, nothing stored or sent');
      return 'pending';
    }
    console.error('[newsletter] Supabase not configured');
    return 'error';
  }
  const c = newConfirmation();
  const db = await dbNewsletterSubscribe({
    email: input.email,
    first_name: input.firstName ?? null,
    language: input.locale,
    interests: input.interests,
    consent_version: NEWSLETTER_CONSENT_VERSION,
    privacy_version: PRIVACY_VERSION,
    // where the request was made: the newsletter form, placed in the footer, the final section or the news page
    source: NEWSLETTER_FORM.id,
    placement: input.source ?? null,
    source_page: input.sourcePage ?? null,
    utm: input.utm,
    token_hash: c.tokenHash,
    ttl_hours: c.ttlHours,
  });
  if (!db.ok) return 'error';
  const known = stateOf(db.data.action);
  if (known) return known;
  return sendConfirmation({ subscriptionId: db.data.id, email: input.email, locale: input.locale, token: c.token, baseUrl: input.baseUrl });
}

export type ConfirmState = 'confirmed' | 'already_confirmed' | 'expired' | 'invalid' | 'error';

/** Double opt-in confirmation; returns the unsubscribe link too, so the page can show it (and it can be tested). */
export async function confirmSubscription(token: string, baseUrl: string): Promise<{ state: ConfirmState; unsubscribeUrl?: string | null }> {
  const db = await dbConfirm(hashToken(token));
  if (!db.ok) return { state: db.reason === 'not_configured' && devMock() ? 'invalid' : 'error' };
  const { action, id, contact_id, email, language } = db.data;
  const locale: Locale = language === 'en' ? 'en' : 'it';
  if ((action === 'confirmed' || action === 'already_confirmed') && id && db.data.needs_welcome) await sendWelcome('newsletter', id, baseUrl);
  // First confirmation only: internal notice to the newsletter inbox, best effort
  if (action === 'confirmed' && email) await notifyNewsletter({ email, locale, source: NEWSLETTER_FORM.id });
  const link = contact_id && (action === 'confirmed' || action === 'already_confirmed') ? unsubscribeUrl(baseUrl, locale, contact_id) : undefined;
  return { state: action, unsubscribeUrl: link };
}

const FORM_KIND: Record<string, JoinKind> = {
  company_request: 'company',
  startup_application: 'pitch',
  investor_application: 'invest',
  giveback_application: 'giveback',
  job_application: 'cv',
};

/**
 * Welcome (newsletter) or acknowledgement (request) email, at most once per record: the database claim is atomic, and
 * a failed send releases the claim so the daily job can try again (max 5 attempts).
 */
export async function sendWelcome(kind: 'newsletter' | 'submission', id: string, baseUrl: string): Promise<boolean> {
  if (!brevoConfig()) return false;
  const claim = await dbClaimAck(kind, id);
  if (!claim?.email) return false; // already sent (or being sent) — never twice
  const locale: Locale = claim.language === 'en' ? 'en' : 'it';
  const content =
    kind === 'newsletter'
      ? newsletterWelcomeEmail(locale, claim.contact_id ? unsubscribeUrl(baseUrl, locale, claim.contact_id) : null)
      : joinReceivedEmail(locale, FORM_KIND[claim.form_type ?? ''] ?? 'company', claim.first_name ?? '');
  const sent = await sendTransactional(claim.email, content, kind === 'newsletter' ? 'newsletter-welcome' : 'join-received');
  await dbFinishAck(kind, id, sent.ok);
  return sent.ok;
}

/** Daily retry (GET /api/cron/brevo-retry): acknowledgements and welcome emails that failed. Never a confirmation. */
export async function retryPending(baseUrl: string) {
  const work = await dbPendingEmails();
  if (!work.ok) return { ok: false as const };
  let sent = 0;
  for (const id of work.data.newsletter ?? []) if (await sendWelcome('newsletter', id, baseUrl)) sent++;
  for (const id of work.data.submissions ?? []) if (await sendWelcome('submission', id, baseUrl)) sent++;
  return { ok: true as const, sent };
}

/** Base URL for links in emails: the configured site URL, else this deployment (Vercel), else the request origin. */
export function publicBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}
