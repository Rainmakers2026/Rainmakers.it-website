import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { Locale } from '@/content/types';
import { NEWSLETTER_CONSENT_VERSION } from '@/lib/options';
import { supabaseConfig } from '@/lib/supabase/rest';
import {
  dbClaimWelcome,
  dbConfirm,
  dbPendingWork,
  dbRecordConfirmation,
  dbRecordSync,
  dbReleaseWelcome,
  dbSubscribe,
  type ConfirmedSubscriber,
} from '@/lib/supabase/newsletter';
import { brevoConfig } from './client';
import { addToContactsList } from './contacts';
import { sendTransactional } from './transactional';
import { confirmationEmail, joinReceivedEmail, newsletterWelcomeEmail } from './templates';

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

export async function requestSubscription(input: { email: string; locale: Locale; source?: string; baseUrl: string }): Promise<SubscribeState> {
  if (!supabaseConfig('service')) {
    if (devMock()) {
      console.info('[newsletter] Supabase not configured — mock mode, nothing stored or sent');
      return 'pending';
    }
    console.error('[newsletter] Supabase not configured');
    return 'error';
  }

  const token = newToken();
  const db = await dbSubscribe({
    email: input.email,
    locale: input.locale,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    source: input.source,
    tokenHash: hashToken(token),
    ttlHours: CONFIRM_TTL_HOURS,
  });
  if (!db.ok) return 'error';
  if (db.data.action === 'already_subscribed') return 'already';
  if (db.data.action === 'confirmation_recent' || !db.data.id) return 'pending_recent';

  const url = `${input.baseUrl}/${input.locale}/newsletter/confirm?token=${token}`;
  if (!brevoConfig()) {
    await dbRecordConfirmation(db.data.id, false);
    if (devMock()) {
      console.info('[newsletter] Brevo not configured — mock mode, confirmation email not sent');
      return 'pending';
    }
    console.error('[newsletter] Brevo not configured — confirmation email not sent');
    return 'email_failed';
  }
  const sent = await sendTransactional(input.email, confirmationEmail(input.locale, url, CONFIRM_TTL_HOURS), 'newsletter-confirmation');
  await dbRecordConfirmation(db.data.id, sent.ok);
  return sent.ok ? 'pending' : 'email_failed';
}

/** Steps after double opt-in, each idempotent: add to "Contatti", then the welcome email (at most once). */
export async function completeSubscription(sub: Pick<ConfirmedSubscriber, 'id' | 'email' | 'needs_sync' | 'needs_welcome'>) {
  if (!brevoConfig()) {
    console.error('[newsletter] Brevo not configured — sync and welcome left pending for the retry job');
    return;
  }
  if (sub.needs_sync) {
    const sync = await addToContactsList(sub.email);
    await dbRecordSync(sub.id, sync.ok, sync.ok ? null : sync.reason);
  }
  if (sub.needs_welcome) await sendWelcome('newsletter', sub.id);
}

export type ConfirmState = 'confirmed' | 'already_confirmed' | 'expired' | 'invalid' | 'error';

export async function confirmSubscription(token: string): Promise<ConfirmState> {
  const db = await dbConfirm(hashToken(token));
  if (!db.ok) return db.reason === 'not_configured' && devMock() ? 'invalid' : 'error';
  const { action } = db.data;
  if ((action === 'confirmed' || action === 'already_confirmed') && db.data.id && db.data.email) {
    // The subscription is confirmed in Supabase whatever happens next; Brevo failures are retried by the cron.
    await completeSubscription({
      id: db.data.id,
      email: db.data.email,
      needs_sync: !!db.data.needs_sync,
      needs_welcome: !!db.data.needs_welcome,
    });
  }
  return action;
}

/**
 * Welcome / acknowledgement email, sent at most once per record: the database claim is atomic,
 * and a failed send releases the claim so the retry job can try again (max 5 attempts).
 */
export async function sendWelcome(kind: 'newsletter' | 'join', id: string): Promise<boolean> {
  if (!brevoConfig()) return false;
  const claim = await dbClaimWelcome(kind, id);
  if (!claim?.email) return false; // already sent (or being sent) — never twice
  const locale: Locale = claim.language === 'en' ? 'en' : 'it';
  const content =
    kind === 'newsletter' ? newsletterWelcomeEmail(locale) : joinReceivedEmail(locale, claim.kind === 'cv' ? 'cv' : 'pitch', claim.first_name ?? '');
  const sent = await sendTransactional(claim.email, content, kind === 'newsletter' ? 'newsletter-welcome' : 'join-received');
  if (!sent.ok) await dbReleaseWelcome(kind, id);
  return sent.ok;
}

/** Daily retry (GET /api/cron/brevo-retry): pending list syncs and failed welcome emails. */
export async function retryPending() {
  const work = await dbPendingWork();
  if (!work.ok) return { ok: false as const };
  let synced = 0;
  let welcomed = 0;
  for (const sub of work.data.newsletter ?? []) {
    if (sub.needs_sync) {
      const sync = await addToContactsList(sub.email);
      await dbRecordSync(sub.id, sync.ok, sync.ok ? null : sync.reason);
      if (sync.ok) synced++;
    }
    if (sub.needs_welcome && (await sendWelcome('newsletter', sub.id))) welcomed++;
  }
  for (const id of work.data.join ?? []) if (await sendWelcome('join', id)) welcomed++;
  return { ok: true as const, synced, welcomed };
}

/** Base URL for links in emails: the configured site URL, else this deployment (Vercel), else the request origin. */
export function publicBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}
