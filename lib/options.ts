/**
 * Canonical option values stored in the database.
 * Labels are localized in content/*.ts; scripts/check-content.ts verifies they match.
 */
export const INTENTS = ['join', 'community', 'contact'] as const;

export const COMPANY_STAGES = [
  'idea',
  'pre-seed',
  'seed',
  'early-stage',
  'growth',
  'scaleup',
  'established',
  'other',
] as const;

export const CHALLENGES = [
  'funding',
  'sales',
  'marketing',
  'technology',
  'hiring',
  'strategy',
  'partnerships',
  'internationalisation',
  'networking',
  'innovation',
  'other',
] as const;

export const INTERESTS = [
  'networking',
  'knowledge',
  'communities',
  'opportunities',
  'fundraising',
  'ecosystem',
  'events',
  'mentoring',
] as const;

export const SOURCES = [
  'google',
  'ai-assistant',
  'linkedin',
  'social',
  'referral',
  'event',
  'rainforest',
  'community',
  'partner',
  'other',
] as const;

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** Bump when the consent text changes, so we know which wording each lead accepted. */
export const CONSENT_VERSION = '2026-10-v1';
