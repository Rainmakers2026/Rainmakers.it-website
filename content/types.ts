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
  what: 'what',
  founder: 'founder',
  track: 'track',
  tribe: 'tribe',
  advisory: 'advisory',
  reviews: 'reviews',
  rainforest: 'rainforest',
  faq: 'faq',
  connect: 'connect',
  /** "Cosa fa Rainmakers" chart, its own section (header "Cosa") */
  services: 'services',
  /** The purpose in the hero (header "Perché") */
  purpose: 'perche',
  /** Giveback initiatives in the track record (not 'giveback': that hash opens the "Unisciti al Giveback" popup) */
  givebackInitiatives: 'giveback-initiatives',
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
  /** Header (2026-10-26): Perché · Come · Cosa · Chi · Contattaci · News */
  nav: {
    why: string;
    how: string;
    what: string;
    who: string;
    contact: string;
    news: string;
  };
  cta: {
    /** Primary conversion CTA — leads to the "how do you want to join" section */
    start: string;
    /** Italian Rainforest (external) */
    exploreRainforest: string;
    /** Header CTA → the "Come vuoi iniziare?" cards */
    join: string;
    /** Contact form */
    connect: string;
  };
  placeholderBadge: string;
  /** Words of the scrolling keyword bands (decorative) */
  keywords: string[];
  notFound: { title: string; text: string; back: string };
}

/** Hero: value proposition (PRD §5.3 step 1). */
export interface HeroCopy {
  /** Small blue claim above the title: "Il nostro scopo" (header "Perché", 2026-10-27) */
  eyebrow: string;
  /** The purpose, split so the key phrase can be set apart: title + accent + tail */
  title: string;
  titleAccent: string;
  titleTail: string;
  lead: string;
  /** Hero-only CTA label (the sticky CTA keeps ui.cta.start) */
  primaryCta: string;
  /** Accessible name of the scroll cue under the hero */
  scrollLabel: string;
  /** Alt text of the hero illustration */
  visualLabel: string;
}

/** Why Rainmakers: the benefits for an entrepreneur (PRD §5.3 step 2). */
export interface BenefitsCopy {
  title: string;
  /** Explicit, quotable entity definition for search & answer engines (PRD §17.4). */
  definition: string;
  /** Alt text of the shelter-vs-harvest illustration */
  artAlt: string;
  /** Alt text of the photographic umbrella image, used once content/shared.ts → visuals.benefitsImage is set */
  imageAlt: string;
}

/** Founder section (PRD §6): only verified facts. */
export interface FounderCopy {
  eyebrow: string;
  title: string;
  text: string;
  name: string;
  role: string;
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
  /** Giveback initiatives (content/data/giveback.ts), after the Tribe and the advisory projects */
  giveback: {
    title: string;
    intro: string;
    typeLabel: string;
  };
  advisory: {
    title: string;
    intro: string;
    typeLabels: Record<'corporate' | 'investor' | 'association' | 'institution' | 'third_sector', string>;
    dataNote: string;
  };
  /** Logo cards and their detail popup */
  cards: {
    /** Accessible name of a card: "{name}: details" */
    open: string;
    project: string;
    participation: string;
    impact: string;
    keyFacts: string;
    visit: string;
    close: string;
    /** What each Tribe status means, shown under "Partecipazione" */
    statusText: Record<'active' | 'exit' | 'minority' | 'writeoff', string>;
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
  statsTitle: string;
  statsTotalLabel: string;
  statsItalyLabel: string;
  statsSource: string;
  categories: Record<string, string>;
  /** "+ {n} more categories on the map" under the shortened counter */
  statsMore: string;
  contribute: string;
}

/** Network map in the Track record header. The `community` key is internal (icon); its label reads "Network". */
export interface NetworkNodeCopy {
  key: 'people' | 'knowledge' | 'community' | 'opportunities' | 'ecosystem' | 'growth';
  label: string;
  text: string;
}

export interface HowCopy {
  centerLabel: string;
  hint: string;
  mapLabel: string;
  nodes: NetworkNodeCopy[];
}

/**
 * "Cosa fa Rainmakers" (#what): texts from the "Italian Rainforest" presentation (Milano, 2026) and the
 * Rainmakers structure chart — Advisory, Open Venture Builder, Capital, Foundation.
 */
export interface WhatCopy {
  eyebrow: string;
  title: string;
  /** Innovation advisor + open venture builder, active since 2011 */
  lead: string;
  /** 40+ advisory projects, 30+ startups */
  stats: { value: string; label: string }[];
  structure: {
    /** "Tocca un servizio…" above the chart */
    hint: string;
    /** Accessible description of the chart */
    label: string;
    /** Label of the examples inside a unit's popup */
    examplesLabel: string;
    /** Close button of the popup */
    close: string;
    /** Branches in chart order */
    branches: { key: 'advisory' | 'builder' | 'giveback'; name: string; tagline: string; units: ServiceUnit[] }[];
  };
  meaningful: {
    title: string;
    text: string;
    /** "Il bene, fatto bene, che paga bene": each line is [before, highlighted word] */
    motto: [string, string][];
    /** The 3 P: Paese, Persone, Pianeta */
    pillarsLabel: string;
    pillars: TitleText[];
  };
  giveback: {
    eyebrow: string;
    title: string;
    text: string;
    tools: string[];
  };
}

/** One clickable unit of the "Cosa fa Rainmakers" chart; its details open in place. */
export interface ServiceUnit {
  name: string;
  /** One line, always visible */
  text: string;
  /** Business unit name, e.g. "Rainmakers Innovation" */
  brand: string;
  /** e.g. "Coming soon" */
  badge?: string;
  lead: string;
  points: string[];
  examples?: string[];
  /** "Come vuoi iniziare?" popup opened by the CTA */
  cta: { label: string; path: StartPathKey };
}

/** Short maxims shown as an animated band (screenshots supplied on 2026-10-19). */
export interface MantrasCopy {
  label: string;
  items: string[];
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

/** "Lascia una review" popup form (POST /api/review). */
export interface ReviewFormCopy {
  name: string;
  email: string;
  company: string;
  role: string;
  optional: string;
  rating: string;
  ratingLabels: [string, string, string, string, string];
  review: string;
  reviewHint: string;
  publishConsent: string;
  consent: string;
  privacy: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  orPlatform: string;
  errors: {
    required: string;
    email: string;
    consent: string;
    tooLong: string;
    tooShort: string;
    summary: string;
    generic: string;
    rateLimited: string;
  };
}

export interface ProofCopy {
  title: string;
  /** "Leave a review" button under the title, opening the review popup */
  review: {
    cta: string;
    /** Popup opened by the CTA */
    popTitle: string;
    popText: string;
    close: string;
    form: ReviewFormCopy;
  };
  testimonials: Testimonial[];
  /** Review carousel controls */
  carousel: {
    label: string;
    prev: string;
    next: string;
    /** "Review {n} of {total}" */
    goTo: string;
    pause: string;
    play: string;
  };
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
    /** Three-step form */
    steps: {
      labels: [string, string, string];
      /** "Step {n} of {total}" */
      progress: string;
      next: string;
      back: string;
    };
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
    joinText: string;
    reset: string;
  };
}

export interface FaqCopy {
  eyebrow: string;
  title: string;
  items: { q: string; a: string }[];
}

/** The "Come vuoi iniziare?" cards, in display order. */
export const START_PATHS = ['company', 'startup', 'giveback', 'work', 'invest'] as const;
export type StartPathKey = (typeof START_PATHS)[number];

/**
 * Final conversion section: five ways in — company, startup, giveback, work, invest — each card opening its popup
 * form in steps (saved to Supabase and Airtable, emailed to the team), then the newsletter signup and the contact
 * mini form. Also the target of the "Unisciti a noi" header CTA.
 */
export interface FinalCopy {
  title: string;
  intro: string;
  paths: Record<StartPathKey, FinalPath>;
  /** Newsletter block that closes the page (replaces the "Connettiti con Rainmakers" form, 2026-10-21) */
  newsletter: {
    eyebrow: string;
    title: string;
    /** Highlighted end of the title */
    titleAccent: string;
    lead: string;
    perks: string[];
    /** "One email a month, no spam…" */
    promise: string;
  };
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
  legal: string;
  privacy: string;
  cookies: string;
  rights: string;
  emailLabel: string;
  /** Newsletter column: title and one line */
  newsletter: string;
  newsletterText: string;
  /** Follows the Substack name ("Italian Rainmaker"), e.g. "su Substack". */
  onSubstack: string;
  language: string;
  /** Label above the social icons */
  follow: string;
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
  what: WhatCopy;
  mantras: MantrasCopy;
  rainforest: RainforestCopy;
  proof: ProofCopy;
  connect: ConnectCopy;
  faq: FaqCopy;
  final: FinalCopy;
  footer: FooterCopy;
  legal: LegalCopy;
}
