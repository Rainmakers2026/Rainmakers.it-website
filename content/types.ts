/**
 * Content model for the one-page site.
 * All user-facing copy lives in content/it.ts and content/en.ts and must satisfy this type,
 * so the two languages can never drift structurally.
 */

export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Intent = 'join' | 'community' | 'contact';

export interface TitleText {
  title: string;
  text: string;
}

export interface Option {
  value: string;
  label: string;
}

export interface Testimonial {
  /** Original quote, kept faithful to the published source (see docs/01-content-audit.md). */
  quote: string;
  people: string;
  company: string;
  /** What they were looking for — derived only from the quote itself. */
  need: string;
  /** What changed — derived only from the quote itself. */
  outcome: string;
}

export interface Dictionary {
  locale: Locale;
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImageAlt: string;
    keywords: string[];
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    mainNav: string;
    languageSwitch: string;
    external: string;
  };
  nav: {
    why: string;
    value: string;
    ecosystem: string;
    communities: string;
    about: string;
    join: string;
  };
  cta: {
    join: string;
    rainforest: string;
    community: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    lead: string;
    connectsLabel: string;
    connects: string[];
    visualLabel: string;
    sinceLabel: string;
  };
  challenge: {
    eyebrow: string;
    title: string;
    intro: string;
    items: TitleText[];
    closing: string;
  };
  about: {
    eyebrow: string;
    title: string;
    text: string;
    definition: string;
    notTitle: string;
    notList: string[];
    notOutro: string;
  };
  value: {
    eyebrow: string;
    title: string;
    intro: string;
    pillars: TitleText[];
  };
  how: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: TitleText[];
    layersTitle: string;
    layers: { name: string; role: string; text: string; tags: string[] }[];
    modelLabel: string;
    model: {
      entrepreneur: string;
      rainmakers: string;
      people: string;
      knowledge: string;
      community: string;
      rainforest: string;
      ecosystem: string;
      outcomes: string;
    };
  };
  rainforest: {
    eyebrow: string;
    title: string;
    text: string;
    formula: string;
    statsTitle: string;
    statsTotalLabel: string;
    statsCountriesLabel: string;
    statsSource: string;
    categories: Record<string, string>;
    features: TitleText[];
    secondaryCta: string;
  };
  community: {
    eyebrow: string;
    title: string;
    text: string;
    bullets: TitleText[];
    exclusiveTitle: string;
    exclusiveText: string;
    quote: string;
    quoteSource: string;
    accessNote: string;
    limitedNote: string;
    publicCommunityText: string;
    publicCommunityCta: string;
  };
  proof: {
    eyebrow: string;
    title: string;
    intro: string;
    facts: { value: string; label: string }[];
    needLabel: string;
    outcomeLabel: string;
    testimonials: Testimonial[];
    tribeTitle: string;
    tribeNote: string;
    historyTitle: string;
    historyText: string;
    meaningfulTitle: string;
    meaningfulText: string;
    meaningfulLegacy: string;
  };
  audience: {
    eyebrow: string;
    title: string;
    primary: TitleText[];
    secondaryTitle: string;
    secondary: string[];
    secondaryNote: string;
  };
  join: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: TitleText[];
  };
  form: {
    intentLabel: string;
    intents: Record<Intent, { label: string; hint: string; submit: string }>;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    role: string;
    companyStage: string;
    companyStagePlaceholder: string;
    stages: Option[];
    moreToggle: string;
    moreHint: string;
    website: string;
    linkedin: string;
    challenges: string;
    challengeOptions: Option[];
    interests: string;
    interestOptions: Option[];
    source: string;
    sourcePlaceholder: string;
    sourceOptions: Option[];
    message: string;
    messageRequired: string;
    messagePlaceholder: string;
    consent: string;
    consentLink: string;
    required: string;
    optional: string;
    submitting: string;
    errors: {
      required: string;
      email: string;
      url: string;
      linkedin: string;
      consent: string;
      tooLong: string;
      generic: string;
      rateLimited: string;
      summary: string;
    };
  };
  thanks: {
    title: string;
    text: Record<Intent, string>;
    nextTitle: string;
    rainforestText: string;
    communityText: string;
    reset: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  final: {
    title: string;
    text: string;
  };
  footer: {
    tagline: string;
    explore: string;
    contacts: string;
    legal: string;
    privacy: string;
    rights: string;
    rainforestEmailLabel: string;
    generalEmailLabel: string;
  };
  privacy: {
    title: string;
    draftNotice: string;
    updated: string;
    sections: { title: string; body: string[] }[];
    back: string;
  };
  notFound: {
    title: string;
    text: string;
    back: string;
  };
}
