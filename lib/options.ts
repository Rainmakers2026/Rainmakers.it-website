/**
 * Canonical option values stored in the database.
 * Labels are localized in content/{it,en}/connect.ts; scripts/check-content.ts verifies they match.
 */
export const PROFILE_TYPES = ['founder', 'startup', 'investor', 'corporate', 'innovation_professional', 'other'] as const;
export type ProfileType = (typeof PROFILE_TYPES)[number];

export const INTENTS = ['join', 'community', 'contact'] as const;
export type Intent = (typeof INTENTS)[number];

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** Bump when the consent text changes, so we know which wording each lead accepted. */
export const CONSENT_VERSION = '2026-10-v2';

/** Newsletter consent wording version (NewsletterSignup) — stored with every subscription as consent evidence. */
export const NEWSLETTER_CONSENT_VERSION = '2026-10-newsletter-v1';
