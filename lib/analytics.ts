'use client';

import { track as vercelTrack } from '@vercel/analytics';

/**
 * Event catalogue (PRD §44). Keep names stable: they feed dashboards and KPIs.
 */
export type AnalyticsEvent =
  | 'page_view'
  | 'language_switch'
  | 'hero_cta_click'
  | 'rainforest_cta_click'
  | 'community_cta_click'
  | 'contact_cta_click'
  | 'review_cta_click'
  | 'review_submit'
  | 'lead_form_start'
  | 'lead_form_submit'
  | 'lead_form_error'
  | 'whatsapp_click'
  | 'faq_open'
  | 'scroll_depth'
  | 'tribe_card_expand'
  | 'advisory_card_expand'
  | 'giveback_card_expand'
  | 'service_expand'
  | 'explorer_filter'
  | 'video_play'
  | 'join_application_submit'
  | 'community_request'
  | 'newsletter_signup';

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
