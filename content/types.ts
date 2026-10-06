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
  about: 'about',
  access: 'access',
  rainforest: 'rainforest',
  network: 'network',
  how: 'how',
  audience: 'audience',
  community: 'community',
  connect: 'connect',
  model: 'model',
  tribe: 'tribe',
  advisory: 'advisory',
  faq: 'faq',
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
  nav: { why: string; access: string; rainforest: string; model: string; community: string; track: string; connect: string };
  cta: {
    /** Primary — to Italian Rainforest */
    explore: string;
    /** Primary, explicit target name */
    exploreRainforest: string;
    /** Secondary — to the community selection */
    community: string;
    /** Tertiary — to the lead form */
    connect: string;
  };
  placeholderBadge: string;
  notFound: { title: string; text: string; back: string };
}

export interface HeroCopy {
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  visualLabel: string;
}

export interface WhyCopy {
  eyebrow: string;
  title: string;
  intro: string;
  notOnlyLabel: string;
  notOnly: string[];
  accessLabel: string;
  access: string[];
  statement: string;
}

export interface AboutCopy {
  eyebrow: string;
  title: string;
  /** Explicit entity definition for search & answer engines (PRD §23). */
  definition: string;
  text: string;
  notTitle: string;
  notList: string[];
  notOutro: string;
  heritageTitle: string;
  heritage: TitleText[];
  /** Mission as stated in the company overview */
  mission: string;
  founder: {
    label: string;
    name: string;
    role: string;
    motto: string;
    quoteTitle: string;
    quote: string;
    linkedinLabel: string;
  };
}

export interface ModelUnit {
  key: 'advisory' | 'investments' | 'club' | 'lab' | 'tribe' | 'community';
  name: string;
  tagline: string;
  text: string;
  forYou: string;
  items?: string[];
  stat?: { value: string; label: string };
  link?: { label: string; target: 'tribe' | 'advisory' };
}

export interface ModelCopy {
  eyebrow: string;
  title: string;
  intro: string;
  forYouLabel: string;
  units: ModelUnit[];
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

export interface AccessCopy {
  eyebrow: string;
  title: string;
  intro: string;
  items: TitleText[];
  disclaimer: string;
}

export interface RainforestCopy {
  eyebrow: string;
  title: string;
  tagline: string;
  text: string;
  formula: string;
  exploreLabel: string;
  explore: string[];
  statsTitle: string;
  statsTotalLabel: string;
  statsItalyLabel: string;
  statsSource: string;
  categories: Record<string, string>;
  contribute: string;
}

export interface NetworkNodeCopy {
  key: 'entrepreneurs' | 'expertise' | 'capital' | 'communities' | 'institutions' | 'corporates' | 'startups';
  label: string;
  text: string;
}

export interface NetworkCopy {
  eyebrow: string;
  title: string;
  intro: string;
  centerLabel: string;
  hint: string;
  nodes: NetworkNodeCopy[];
  mapLabel: string;
  layersTitle: string;
  layers: { name: string; role: string; text: string }[];
}

export interface HowCopy {
  eyebrow: string;
  title: string;
  steps: TitleText[];
}

export interface AudienceCopy {
  eyebrow: string;
  title: string;
  intro: string;
  primaryTitle: string;
  primary: string[];
  secondaryTitle: string;
  secondary: TitleText[];
}

export interface Testimonial {
  quote: string;
  people: string;
  company: string;
  /** Only VERIFIED (authorised, still valid) testimonials are rendered — PRD §26. */
  status: ContentStatus;
  source: string;
}

export interface ProofCopy {
  eyebrow: string;
  title: string;
  testimonials: Testimonial[];
}

export interface CommunityCopy {
  eyebrow: string;
  title: string;
  text: string;
  spacesLabel: string;
  spaces: string[];
  listTitle: string;
  join: string;
  full: string;
  comingSoon: string;
  linkMissing: string;
  categoryLabel: string;
  targetLabel: string;
  note: string;
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

export interface FinalCopy {
  title: string;
  text: string;
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
  rainforestEmailLabel: string;
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
  why: WhyCopy;
  about: AboutCopy;
  access: AccessCopy;
  rainforest: RainforestCopy;
  network: NetworkCopy;
  how: HowCopy;
  audience: AudienceCopy;
  model: ModelCopy;
  track: TrackCopy;
  proof: ProofCopy;
  community: CommunityCopy;
  connect: ConnectCopy;
  faq: FaqCopy;
  final: FinalCopy;
  footer: FooterCopy;
  legal: LegalCopy;
}
