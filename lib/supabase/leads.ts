import 'server-only';
import type { CommunitySubmission, ContactSubmission, ReviewSubmission } from '@/lib/validation';
import { CONSENT_VERSION } from '@/lib/options';
import { authHeaders, supabaseConfig } from './rest';

export type StoreResult =
  | { ok: true; id: string | null; duplicate: boolean; mock?: true }
  | { ok: false; reason: 'rate_limited' | 'error' | 'not_configured'; /** Postgres error code, when known */ code?: string };

/**
 * Calls one of the submit_* Postgres functions (supabase/migrations/0003) with the service key.
 * Without Supabase configuration: development accepts and logs (mock); production returns not_configured,
 * so a visitor is never told that an unsaved request was received.
 */
async function rpc(fn: 'submit_contact' | 'submit_community_request' | 'submit_review', payload: Record<string, unknown>, idKey: string): Promise<StoreResult> {
  const cfg = supabaseConfig('service');
  if (!cfg) {
    if (process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1') {
      console.info(`[${fn}] Supabase not configured — mock mode, nothing stored`);
      return { ok: true, id: null, duplicate: false, mock: true };
    }
    console.error(`[${fn}] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing`);
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: payload }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text();
      if (body.includes('rate_limited')) return { ok: false, reason: 'rate_limited' };
      // Postgres error code/message only — the payload (personal data) is never logged
      console.error(`[${fn}] Supabase error`, res.status, body.slice(0, 300));
      const code = /"code"\s*:\s*"(\w+)"/.exec(body)?.[1];
      return { ok: false, reason: 'error', code };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: true, id: (data[idKey] as string) ?? null, duplicate: data.duplicate === true };
  } catch {
    console.error(`[${fn}] network error`);
    return { ok: false, reason: 'error' };
  }
}

const person = (s: { locale: string; firstName: string; email: string; utm?: Record<string, string> }) => ({
  first_name: s.firstName,
  email: s.email,
  language: s.locale,
  consent: true,
  consent_version: CONSENT_VERSION,
  utm: s.utm ?? {},
});

/** "Connettiti con Rainmakers" → contact_requests. */
export function submitContact(s: ContactSubmission) {
  return rpc(
    'submit_contact',
    {
      ...person(s),
      last_name: s.lastName,
      company: s.company,
      role: s.role,
      link: s.link ?? null,
      profile_type: s.profileType,
      message: s.interest ?? null,
      idempotency_key: s.idempotencyKey,
    },
    'request_id',
  );
}

/** "Entra su WhatsApp" → community_requests. */
export function submitCommunityRequest(s: CommunitySubmission) {
  return rpc('submit_community_request', { ...person(s), community_slug: s.community }, 'request_id');
}

/** "Lascia una review" → reviews (migration 0007). */
export function submitReview(s: ReviewSubmission) {
  return rpc(
    'submit_review',
    {
      ...person({ locale: s.locale, firstName: s.name, email: s.email, utm: s.utm }),
      company: s.company || null,
      role: s.role || null,
      rating: s.rating ?? null,
      body: s.review,
      publish_consent: s.publishConsent === true,
      idempotency_key: s.idempotencyKey,
    },
    'review_id',
  );
}

/** Records that the team email for a review was sent (best effort). */
export async function markReviewNotified(id: string) {
  const cfg = supabaseConfig('service');
  if (!cfg) return;
  try {
    await fetch(`${cfg.url}/rest/v1/rpc/review_mark_notified`, {
      method: 'POST',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: id }),
      cache: 'no-store',
    });
  } catch {
    console.error('[review_mark_notified] network error');
  }
}
