/**
 * Language-independent facts and configuration, each with its governance status.
 * Sources: see docs/01-content-audit.md. Run `npm run check:placeholders` before release.
 */
import { PH, fact } from './governance';

export const site = {
  name: 'Rainmakers',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rainmakers.it').replace(/\/$/, ''),
} as const;

export const facts = {
  /** "Since 2011" — rainmakers.it (EN), "Who we are". */
  foundingYear: fact(2011, 'VERIFIED', 'rainmakers.it/en — “We are Rainmakers. Since 2011.”'),
  /** "Based in Milan" — rainmakers.it (EN), "How we work". */
  city: fact('Milano', 'VERIFIED', 'rainmakers.it/en — “Based in Milan”'),
  /** Legal entity, address and VAT appear on nuvolab.com (2021). Not shown until confirmed (PRD §48). */
  legalEntity: fact(PH.provided, 'TO_VERIFY', 'nuvolab.com footer (2021)', 'Rainmakers s.r.l. a Socio Unico, Via Carducci 8, Milano — confirm before publishing'),
  /** General contact email: not confirmed → the site routes contact through the form. */
  contactEmail: fact(PH.provided, 'PLACEHOLDER'),
  /** Italian Rainforest contact — published on italian-innovation-map.vercel.app. */
  rainforestEmail: fact('italianrainforest@rainmakers.it', 'VERIFIED', 'italian-innovation-map.vercel.app/en — Contact'),
};

/** Only verified profiles go here (used in footer and schema.org sameAs). */
export const socialProfiles: { name: string; url: string }[] = [
  // Facebook "rainmakerssrl" appears in 2021 site metadata — TO_VERIFY, not listed until confirmed.
];

export const rainforest = {
  url: 'https://italian-innovation-map.vercel.app',
  urlFor: (locale: 'it' | 'en') => `https://italian-innovation-map.vercel.app/${locale}`,
  /**
   * Public figures shown on Italian Rainforest on the date below (VERIFIED, dated).
   * Update `asOf` and the numbers at each release.
   */
  stats: {
    status: 'VERIFIED' as const,
    asOf: '2026-10-06',
    activeOrganisations: 412,
    italy: 308,
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

/**
 * Logo files (PRD §31). Set `available: true` once the files are in public/brand/.
 * Until then the Logo component renders a provisional wordmark.
 */
export const brand = {
  available: false,
  files: {
    white: '/brand/logo-standard-white.svg',
    black: '/brand/logo-standard-black.svg',
    color: '/brand/logo-standard-color.svg',
    squareWhite: '/brand/logo-square-white.svg',
    squareBlack: '/brand/logo-square-black.svg',
    squareColor: '/brand/logo-square-color.svg',
    squarePng: '/brand/logo-square-color.png',
  },
} as const;

export type CommunityStatus = 'active' | 'full' | 'coming_soon' | 'archived';

/** Shape shared by Supabase rows and the fallback below. */
export interface Community {
  slug: string;
  name: { it: string; en: string };
  description: { it: string; en: string };
  target: string | null;
  category: string | null;
  whatsappUrl: string | null;
  status: CommunityStatus;
  capacity: number | null;
}

/**
 * Used only when Supabase is not configured or `communities` is empty (PRD §17: no invented data).
 * - Italian Rainforest community: public link published on the Rainforest site (VERIFIED link;
 *   TO_VERIFY that it is the one to promote here).
 * - Rainmakers communities: names and links still to be provided.
 */
export const communitiesFallback: Community[] = [
  {
    slug: 'italian-rainforest',
    name: { it: 'Community Italian Rainforest', en: 'Italian Rainforest Community' },
    description: {
      it: 'La community WhatsApp collegata alla mappa dell’ecosistema italiano dell’innovazione.',
      en: 'The WhatsApp community connected to the map of the Italian innovation ecosystem.',
    },
    target: null,
    category: 'ecosystem',
    whatsappUrl: 'https://chat.whatsapp.com/Fka8dKBYNkw8hbZtTo88U1',
    status: 'active',
    capacity: null,
  },
  {
    slug: 'rainmakers-community',
    name: { it: PH.content, en: PH.content },
    description: { it: PH.content, en: PH.content },
    target: null,
    category: null,
    whatsappUrl: null, // PH.whatsapp
    status: 'coming_soon',
    capacity: null,
  },
];
