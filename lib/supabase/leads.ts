import 'server-only';
import type { Lead } from '@/lib/validation';
import { CONSENT_VERSION } from '@/lib/options';
import { authHeaders, supabaseConfig } from './rest';

export type StoreResult = { ok: true } | { ok: false; reason: 'rate_limited' | 'error' | 'not_configured' };

/** Persists a lead through the `submit_lead` Postgres function (see supabase/migrations). */
export async function storeLead(lead: Lead): Promise<StoreResult> {
  const cfg = supabaseConfig('service');
  if (!cfg) {
    if (process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1') {
      console.info('[leads] Supabase not configured — mock mode. Lead accepted:', { profile: lead.profileType, locale: lead.locale });
      return { ok: true };
    }
    console.error('[leads] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
    return { ok: false, reason: 'not_configured' };
  }

  const payload = {
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    company: lead.company,
    role: lead.role,
    website_or_linkedin: lead.link ?? null,
    profile_type: lead.profileType,
    interest: lead.interest ?? null,
    language: lead.locale,
    consent: lead.consent,
    consent_version: CONSENT_VERSION,
    utm: lead.utm ?? {},
  };

  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/submit_lead`, {
      method: 'POST',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: payload }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text();
      if (body.includes('rate_limited')) return { ok: false, reason: 'rate_limited' };
      console.error('[leads] Supabase error', res.status, body.slice(0, 500));
      return { ok: false, reason: 'error' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[leads] Network error', err);
    return { ok: false, reason: 'error' };
  }
}
