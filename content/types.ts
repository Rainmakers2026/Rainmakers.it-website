/**
 * Content model. Each section has its own type and its own file per language
 * (content/it/*.ts, content/en/*.ts — PRD §33). The Dictionary type guarantees
 * the two languages stay structurally identical.
 */
import type { ContentStatus } from './governance';

export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export interface TitleText {
  title: string;
  text: string;
}
export interface Option {
  value: string;
  label: string;
}

/** Stable section anchors — identical in both languages so the language switch keeps position. */
export const SECTION_IDS = {
  why: 'why',
  founder: 'founder',
  track: 'track',
  tribe: 'tribe',
  advisory: 'advisory',
  how: 'how',
  community: 'community',
  rainforest: 'rainforest',
  reviews: 'reviews',
  faq: 'faq',
  connect: 'connect',
} as const;

export interface MetaCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
}

export interface UiCopy {
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    mainNav: string;
    languageSwitch: string;
    languageName: string;
    external: string;
  };
  nav: { why: string; founder: string; track: string; community: string; rainforest: string; connect: string; news: string };
  cta: {
    /** Primary conversion CTA — leads to the "how do you want to join" section */
    start: string;
    /** Italian Rainforest (external) */
    exploreRainforest: string;
    /** Join the Tribe page (pitch / CV) */
    join: string;
    /** Contact form */
    connect: string;
  };
  placeholderBadge: string;
  notFound: { title: string; text: string; back: string };
}

/** Hero: value proposition (PRD §5.3 step 1). The primary CTA label is ui.cta.start. */
export interface HeroCopy {
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  secondaryCta: string;
  /** Alt text of the hero illustration */
  visualLabel: string;
}

/** Why Rainmakers: the benefits for an entrepreneur (PRD §5.3 step 2). */
export interface BenefitsCopy {
  eyebrow: string;
  title: string;
  /** Explicit, quotable entity definition for search & answer engines (PRD §17.4). */
  definition: string;
  items: TitleText[];
  audienceLabel: string;
  audience: string;
  /** Alt text of the shelter-vs-harvest illustration */
  artAlt: string;
}

/** Founder section (PRD §6): only verified facts. */
export interface FounderCopy {
  eyebrow: string;
  title: string;
  text: string;
  name: string;
  role: string;
  facts: string[];
  /** Alt text for the official photo, used once content/shared.ts `founder.photo` is set. */
  photoAlt: string;
  video: {
    title: string;
    caption: string;
    play: string;
  };
  linkedinLabel: string;
  youtubeLabel: string;
  /** Link to the Substack blog, shown under the name "Italian Rainmaker" (PRD §13). */
  substackLabel: string;
  cta: string;
}

export interface TrackCopy {
  eyebrow: string;
  title: string;
  intro: string;
  stats: { value: string; label: string }[];
  tribe: {
    title: string;
    intro: string;
    statusLabels: Record<'active' | 'exit' | 'minority' | 'writeoff', string>;
    dataNote: string;
  };
  advisory: {
    title: string;
    intro: string;
    typeLabels: Record<'corporate' | 'investor' | 'association' | 'institution' | 'third_sector', string>;
    dataNote: string;
  };
  explorer: {
    searchLabel: string;
    searchPlaceholder: string;
    all: string;
    filterLabel: string;
    sortLabel: string;
    sorts: { az: string; recent: string; oldest: string; size: string };
    results: string;
    showAll: string;
    showLess: string;
    details: string;
    hide: string;
    website: string;
    noResults: string;
    reset: string;
    revenueUnit: string;
    fields: {
      sector: string;
      city: string;
      founded: string;
      fte: string;
      revenue: string;
      status: string;
      client: string;
      project: string;
      type: string;
      location: string;
      year: string;
      impact: string;
      note: string;
      source: string;
    };
  };
}

export interface RainforestCopy {
  /** Must be exactly "Italian Rainforest" (PRD §9.1). */
  title: string;
  headline: string;
  text: string;
  formula: string;
  statsTitle: string;
  statsTotalLabel: string;
  statsItalyLabel: string;
  statsSource: string;
  categories: Record<string, string>;
  contribute: string;
}

export interface NetworkNodeCopy {
  key: 'people' | 'knowledge' | 'community' | 'opportunities' | 'ecosystem' | 'growth';
  label: string;
  text: string;
}

/** How Rainmakers works (PRD §5.3 step 4, §8): network infographic, path, business units. */
export interface HowCopy {
  eyebrow: string;
  title: string;
  intro: string;
  centerLabel: string;
  hint: string;
  mapLabel: string;
  nodes: NetworkNodeCopy[];
  stepsTitle: string;
  steps: TitleText[];
  servicesTitle: string;
  services: { name: string; text: string }[];
}

export interface Testimonial {
  quote: string;
  people: string;
  company: string;
  /** File in /public/brand/The-Tribe-companies-favicons/ */
  logo: string;
  /** Only VERIFIED (authorised, still valid) testimonials are rendered — PRD §26. */
  status: ContentStatus;
  source: string;
}

export interface ProofCopy {
  eyebrow: string;
  title: string;
  intro: string;
  sourceNote: string;
  /** "Leave a review" hook under the testimonials (opens an email to the team) */
  review: { hook: string; cta: string; subject: string; body: string };
  testimonials: Testimonial[];
}

export interface CommunityCopy {
  eyebrow: string;
  title: string;
  text: string;
  listTitle: string;
  join: string;
  full: string;
  comingSoon: string;
  linkMissing: string;
  categoryLabel: string;
  targetLabel: string;
  note: string;
  /** "Entra su WhatsApp" request form (PRD §10.2): saved in community_requests, then the link is shown. */
  form: CommunityFormCopy;
}

export interface CommunityFormCopy {
  intro: string;
  firstName: string;
  email: string;
  consent: string;
  privacy: string;
  submit: string;
  submitting: string;
  cancel: string;
  success: string;
  open: string;
  errors: { required: string; email: string; consent: string; tooLong: string; summary: string; generic: string; rateLimited: string };
}

export interface ConnectCopy {
  eyebrow: string;
  title: string;
  intro: string;
  form: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    role: string;
    link: string;
    linkHint: string;
    profileType: string;
    profilePlaceholder: string;
    profiles: Option[];
    interest: string;
    interestPlaceholder: string;
    consent: string;
    consentLink: string;
    required: string;
    optional: string;
    submit: string;
    submitting: string;
    errors: {
      required: string;
      email: string;
      url: string;
      consent: string;
      tooLong: string;
      generic: string;
      rateLimited: string;
      summary: string;
    };
  };
  success: {
    title: string;
    text: string;
    nextTitle: string;
    rainforestText: string;
    communityText: string;
    reset: string;
  };
}

export interface FaqCopy {
  eyebrow: string;
  title: string;
  items: { q: string; a: string }[];
}

/** Final conversion section: three ways in, then the contact form (PRD §5.3 step 7). */
export interface FinalCopy {
  eyebrow: string;
  title: string;
  text: string;
  paths: { community: FinalPath; join: FinalPath; contact: FinalPath };
}

export interface FinalPath {
  title: string;
  text: string;
  cta: string;
}

export interface FooterCopy {
  tagline: string;
  explore: string;
  contact: string;
  contactCta: string;
  legal: string;
  privacy: string;
  cookies: string;
  rights: string;
  emailLabel: string;
  /** Follows the Substack name ("Italian Rainmaker"), e.g. "su Substack". */
  onSubstack: string;
  language: string;
}

export interface LegalPageCopy {
  title: string;
  draftNotice: string;
  updated: string;
  sections: { title: string; body: string[] }[];
  back: string;
}

export interface LegalCopy {
  privacy: LegalPageCopy;
  cookies: LegalPageCopy;
}

export interface Dictionary {
  locale: Locale;
  meta: MetaCopy;
  ui: UiCopy;
  hero: HeroCopy;
  benefits: BenefitsCopy;
  founder: FounderCopy;
  track: TrackCopy;
  how: HowCopy;
  community: CommunityCopy;
  rainforest: RainforestCopy;
  proof: ProofCopy;
  connect: ConnectCopy;
  faq: FaqCopy;
  final: FinalCopy;
  footer: FooterCopy;
  legal: LegalCopy;
}
