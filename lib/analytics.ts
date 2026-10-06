'use client';

import { track as vercelTrack } from '@vercel/analytics';

/**
 * Event catalogue (PRD §40). Keep names stable: they feed dashboards and KPIs.
 */
export type AnalyticsEvent =
  | 'page_view'
  | 'hero_cta_click'
  | 'rainforest_cta_click'
  | 'community_cta_click'
  | 'contact_cta_click'
  | 'join_cta_click'
  | 'lead_form_start'
  | 'lead_form_submit'
  | 'lead_form_error'
  | 'community_request'
  | 'whatsapp_click'
  | 'faq_open'
  | 'language_switch'
  | 'scroll_25'
  | 'scroll_50'
  | 'scroll_75'
  | 'scroll_90';

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Sends an event to:
 *  - Vercel Web Analytics (cookieless; custom events need a plan that supports them)
 *  - window.dataLayer, so a Tag Manager container can be added later behind a consent banner.
 * Never send personal data (names, emails…) as event properties.
 */
export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === 'undefined') return;
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as Record<
    string,
    string | number | boolean | null
  >;
  try {
    vercelTrack(event, clean);
  } catch {
    /* analytics must never break the page */
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...clean });
  if (process.env.NODE_ENV !== 'production') console.debug('[analytics]', event, clean);
}
