import 'server-only';
import type { Locale } from '@/content/types';
import { rpcCall } from './rest';

/**
 * Newsletter persistence (supabase/migrations/0005). Supabase is the source of truth for the
 * subscription and its consent evidence; Brevo is synced only after double opt-in.
 */
export type SubscribeAction = 'send_confirmation' | 'already_subscribed' | 'confirmation_recent';
export type ConfirmAction = 'confirmed' | 'already_confirmed' | 'expired' | 'invalid';

export interface ConfirmedSubscriber {
  id: string;
  email: string;
  language: Locale;
  needs_sync: boolean;
  needs_welcome: boolean;
}

export type DbResult<T> = { ok: true; data: T } | { ok: false; reason: 'not_configured' | 'error' };

const fail = (status: number, fn: string): { ok: false; reason: 'not_configured' | 'error' } => {
  if (status === 0) return { ok: false, reason: 'not_configured' };
  console.error(`[newsletter] ${fn} failed`, status);
  return { ok: false, reason: 'error' };
};

export async function dbSubscribe(input: {
  email: string;
  locale: Locale;
  consentVersion: string;
  source?: string;
  tokenHash: string;
  ttlHours: number;
}): Promise<DbResult<{ id: string | null; action: SubscribeAction }>> {
  const r = await rpcCall<{ id: string | null; action: SubscribeAction }>('newsletter_subscribe', {
    p: {
      email: input.email,
      language: input.locale,
      consent: true,
      consent_version: input.consentVersion,
      source: input.source ?? null,
      token_hash: input.tokenHash,
      ttl_hours: input.ttlHours,
    },
  });
  return r.ok ? { ok: true, data: r.data } : fail(r.message === 'not_configured' ? 0 : r.status || -1, 'subscribe');
}

export async function dbRecordConfirmation(id: string, ok: boolean) {
  const r = await rpcCall('newsletter_record_confirmation', { p_id: id, p_ok: ok });
  if (!r.ok) console.error('[newsletter] record_confirmation failed', r.status);
}

export async function dbConfirm(tokenHash: string): Promise<DbResult<{ action: ConfirmAction } & Partial<ConfirmedSubscriber>>> {
  const r = await rpcCall<{ action: ConfirmAction } & Partial<ConfirmedSubscriber>>('newsletter_confirm', { p_token_hash: tokenHash });
  return r.ok ? { ok: true, data: r.data } : fail(r.message === 'not_configured' ? 0 : r.status || -1, 'confirm');
}

export async function dbRecordSync(id: string, ok: boolean, error: string | null) {
  const r = await rpcCall('newsletter_record_sync', { p_id: id, p_ok: ok, p_error: error });
  if (!r.ok) console.error('[newsletter] record_sync failed', r.status);
}

/** Atomic claim: returns the recipient only for the first caller; later calls get null. */
export async function dbClaimWelcome(kind: 'newsletter' | 'join', id: string) {
  const r = await rpcCall<{ email?: string; language?: Locale; first_name?: string; kind?: 'pitch' | 'cv' }>('rm_claim_welcome', { p_kind: kind, p_id: id });
  if (!r.ok) {
    console.error('[welcome] claim failed', r.status);
    return null;
  }
  return r.data?.email ? r.data : null;
}

export async function dbReleaseWelcome(kind: 'newsletter' | 'join', id: string) {
  const r = await rpcCall('rm_release_welcome', { p_kind: kind, p_id: id });
  if (!r.ok) console.error('[welcome] release failed', r.status);
}

export async function dbPendingWork() {
  return rpcCall<{ newsletter: ConfirmedSubscriber[]; join: string[] }>('rm_brevo_pending_work', {});
}
