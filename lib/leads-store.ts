import 'server-only';
import type { Lead } from './validation';
import { community } from '@/content/shared';
import { CONSENT_VERSION } from './options';

export type StoreResult = { ok: true; leadId: string } | { ok: false; reason: 'rate_limited' | 'error' | 'not_configured' };

/**
 * Persists a lead through the `submit_lead` Postgres function (Supabase RPC).
 * The function upserts the lead by email and records the community/contact request
 * atomically. Uses the service-role key, which must only ever exist server-side.
 */
export async function storeLead(lead: Lead): Promise<StoreResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production' || process.env.LEADS_MOCK === '1') {
      console.info('[leads] Supabase not configured — mock mode. Lead accepted:', {
        intent: lead.intent,
        stage: lead.companyStage,
      });
      return { ok: true, leadId: 'mock' };
    }
    console.error('[leads] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
    return { ok: false, reason: 'not_configured' };
  }

  const payload = {
    intent: lead.intent,
    locale: lead.locale,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    company: lead.company,
    role: lead.role,
    website: lead.website ?? null,
    linkedin: lead.linkedin ?? null,
    company_stage: lead.companyStage,
    main_challenge: lead.challenges,
    interests: lead.interests,
    source: lead.source ?? null,
    message: lead.message ?? null,
    consent: lead.consent,
    consent_version: CONSENT_VERSION,
    community: lead.intent === 'community' ? community.defaultCommunity : null,
    utm: lead.utm ?? {},
  };

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/submit_lead`, {
      method: 'POST',
      headers: {
        apikey: key,
        // Legacy service_role keys are JWTs and also go in Authorization;
        // new-style secret keys (sb_secret_…) must only be sent as apikey.
        ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p: payload }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      if (body.includes('rate_limited')) return { ok: false, reason: 'rate_limited' };
      console.error('[leads] Supabase error', res.status, body.slice(0, 500));
      return { ok: false, reason: 'error' };
    }
    const data = (await res.json()) as { lead_id: string };
    return { ok: true, leadId: data.lead_id };
  } catch (err) {
    console.error('[leads] Network error', err);
    return { ok: false, reason: 'error' };
  }
}
