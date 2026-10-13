/**
 * Language-independent facts and configuration, each with its governance status.
 * Sources: see docs/01-content-audit.md. Run `npm run check:placeholders` before release.
 */
import { PH, fact } from './governance';

export const site = {
  name: 'Rainmakers',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rainmakers.it').replace(/\/$/, ''),
} as const;

/**
 * Francesco Inguscio's personal blog, shown under the name "Italian Rainmaker" (PRD §13).
 * URL updated on 2026-10-12: francescoinguscio.substack.com returns 404; italianrainmaker.substack.com
 * is "Il Substack di Italian Rainmaker" (same name as the founder's YouTube channel) — TO CONFIRM with the team.
 */
export const substack = {
  name: 'Italian Rainmaker',
  url: 'https://italianrainmaker.substack.com',
} as const;

/**
 * Founder section assets (PRD §6).
 * `photo`: path under /public of the official, team-approved photo (square, ≥ 800 px).
 * Leave null to show the circular placeholder — never use a generated or unapproved image.
 */
export const founderProfile = {
  photo: null as string | null,
  linkedinUrl: 'https://www.linkedin.com/in/italianrainmaker',
  /** Channel "Italian Rainmaker" — author of the video below (YouTube oEmbed). */
  youtubeUrl: 'https://www.youtube.com/@InguscioFrancesco1981',
  /** "IF - Inguscio Francesco - 2014 - Nuovi Occhi (per Imprenditori e Paese) (ITA)" */
  videoId: 'v_fRsxaAzyU',
};

export const facts = {
  /** "Since 2011" — rainmakers.it (EN), "Who we are". */
  foundingYear: fact(2011, 'VERIFIED', 'rainmakers.it/en — “We are Rainmakers. Since 2011.”'),
  /** "Based in Milan" — rainmakers.it (EN), "How we work". */
  city: fact('Milano', 'VERIFIED', 'rainmakers.it/en — “Based in Milan”'),
  /** Legal entity, address and VAT appear on nuvolab.com (2021). Not shown until confirmed (PRD §48). */
  legalEntity: fact(PH.provided, 'TO_VERIFY', 'nuvolab.com footer (2021)', 'Rainmakers s.r.l. a Socio Unico, Via Carducci 8, Milano — confirm before publishing'),
  /**
   * Operational contact address for every mailto on the site, including Italian Rainforest updates (PRD §12).
   * Replaces italianrainforest@rainmakers.it on this site; the Italian Rainforest site itself is out of scope.
   */
  contactEmail: fact('info@rainmakers.it', 'VERIFIED', 'PRD Rainmakers Website Optimization v2.0, §12'),
};

/** Only verified profiles go here (footer icons and schema.org sameAs). */
export const socialProfiles: { name: string; url: string; icon: 'facebook' | 'instagram' }[] = [
  // Linked from the official rainmakers.it header/footer (checked 2026-10-13)
  { name: 'Facebook', url: 'https://www.facebook.com/rainmakerssrl/', icon: 'facebook' },
  // Instagram: no profile is linked from rainmakers.it. Add it here once confirmed (the icon is ready):
  // { name: 'Instagram', url: 'https://www.instagram.com/<handle>/', icon: 'instagram' },
];

export const rainforest = {
  url: 'https://italian-innovation-map.vercel.app',
  urlFor: (locale: 'it' | 'en') => `https://italian-innovation-map.vercel.app/${locale}`,
  /**
   * Section background (PRD §9.3) — the only place to change it. Path under /public, or null for the
   * brand gradient fallback. Current file: the rainforest WebP supplied in the project folder on 2026-10-12
   * ("WhatsApp Image 2026-10-12 at 10.19.17.webp"), 1600×900 — TO CONFIRM as the final asset and its licence.
   */
  background: '/brand/italian-rainforest-bg.webp' as string | null,
  /**
   * Public figures shown on Italian Rainforest on the date below (VERIFIED, dated).
   * Re-checked against the live map on 2026-10-12: unchanged. Update `asOf` and the numbers at each release.
   */
  stats: {
    status: 'VERIFIED' as const,
    asOf: '2026-10-12',
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

/** Official white logo artwork and square mark supplied for the site. */
export const brand = {
  available: true,
  files: {
    white: '/brand/logo-standard-white.png',
    squareWhite: '/brand/logo-mark-white.png',
    squarePng: '/icon.png',
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
