/**
 * Language-independent facts and configuration.
 *
 * RULE: everything here is either verified (source noted) or explicitly marked
 * `TODO_CONFIRM`. Search the codebase for "TODO_CONFIRM" before going live.
 * See docs/01-content-audit.md for sources.
 */

export const site = {
  name: 'Rainmakers',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rainmakers.it').replace(/\/$/, ''),
  /** Verified: "Since 2011" on rainmakers.it */
  foundingYear: 2011,
  city: 'Milano',
  country: 'IT',
} as const;

/** Verified on nuvolab.com footer (2021). TODO_CONFIRM: still current? */
export const legalEntity = {
  name: 'Rainmakers s.r.l. a Socio Unico',
  street: 'Via Carducci 8',
  postalCode: '20123',
  city: 'Milano',
  vat: '07342210965',
} as const;

export const contacts = {
  /** TODO_CONFIRM: general contact address (provisional). */
  general: 'team@rainmakers.it',
  /** Verified on Italian Rainforest. */
  rainforest: 'italianrainforest@rainmakers.it',
} as const;

/** Only profiles we could verify. Add LinkedIn etc. when confirmed (used in schema.org sameAs). */
export const socialProfiles: { name: string; url: string }[] = [
  // Verified as publisher in rainmakers.it metadata. TODO_CONFIRM still active.
  { name: 'Facebook', url: 'https://www.facebook.com/rainmakerssrl/' },
];

export const rainforest = {
  url: 'https://italian-innovation-map.vercel.app',
  urlFor: (locale: 'it' | 'en') => `https://italian-innovation-map.vercel.app/${locale}`,
  /**
   * Live figures read from Italian Rainforest on the date below.
   * Update at each release (or wire to an API in V8 — see roadmap).
   */
  stats: {
    asOf: '2026-10-06',
    activeOrganisations: 412,
    countries: [
      { code: 'IT', count: 308 },
      { code: 'UK', count: 19 },
      { code: 'FR', count: 16 },
      { code: 'ES', count: 15 },
      { code: 'US', count: 14 },
    ],
    categories: [
      { key: 'vc', count: 168 },
      { key: 'incubators', count: 139 },
      { key: 'cvc', count: 38 },
      { key: 'coworking', count: 37 },
      { key: 'studios', count: 29 },
      { key: 'angels', count: 21 },
      { key: 'institutions', count: 13 },
      { key: 'media', count: 13 },
    ],
  },
} as const;

export const community = {
  /**
   * TODO_CONFIRM: set to true ONLY if membership is really capped (PRD §12 — no false scarcity).
   */
  limitedMembership: false,
  /**
   * Public WhatsApp community linked from Italian Rainforest (verified).
   * Private Rainmakers communities are never linked from the client: access is granted after review.
   */
  publicWhatsappUrl: 'https://chat.whatsapp.com/Fka8dKBYNkw8hbZtTo88U1',
  /** Slug stored in community_requests.community. TODO_CONFIRM real community names. */
  defaultCommunity: 'rainmakers-founders',
} as const;

/**
 * Companies listed in the Rainmakers "Tribe" on rainmakers.it (2021).
 * TODO_CONFIRM: remove any company that should no longer be shown.
 */
export const tribe = [
  'BidToTrip',
  'Chi Odia Paga',
  'Coppa+Landini',
  'CrowdChicken',
  'DesignWanted',
  'DIS – Design Italian Shoes',
  'Fornace',
  'Instilla',
  'Kampaay',
  'Mapadore',
  'Ncode',
  'Noonic',
  'Robo4it',
  'Nuvolab',
  'Startup Geeks',
  'StartupHome',
  'This is not a sushi bar',
  'Trovabando',
  'Verbalizza',
  'Zanze XVI',
  'Backbone',
] as const;
