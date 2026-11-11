import type { StartPathKey, UiCopy } from '@/content/types';
import { SECTION_IDS } from '@/content/types';

/**
 * Hash of each "Come vuoi iniziare?" card: landing on it (header link, "Cosa fa Rainmakers" CTAs, other pages)
 * opens that card's popup (components/JoinOptions.tsx).
 */
export const START_HASH: Record<StartPathKey, string> = {
  company: 'innova-la-tua-azienda',
  startup: 'invia-il-pitch',
  giveback: 'giveback',
  work: 'lavora-con-noi',
  invest: 'investi-con-noi',
};

export interface NavItem {
  id: string;
  label: string;
  /** Page outside the one-page (e.g. /news) */
  href?: string;
  /** Shown as the highlighted button (Contattaci) */
  cta?: boolean;
  /** Other sections that also highlight this item in the scroll-spy */
  also?: string[];
}

/**
 * One-page navigation (2026-10-27), in page order: Perché · Come · Cosa · Chi · News · Contattaci.
 * Anchors are identical in both languages.
 */
export const navItems = (ui: Pick<UiCopy, 'nav'>): NavItem[] => [
  // "Perché" → "Il nostro scopo" in the hero
  { id: SECTION_IDS.purpose, label: ui.nav.why, also: ['top'] },
  // "Come" → "C'è chi vede il futuro come un problema da evitare…"
  { id: SECTION_IDS.why, label: ui.nav.how },
  // "Cosa" → "Cosa fa Rainmakers" (figures and chart)
  { id: SECTION_IDS.services, label: ui.nav.what },
  // "Chi" → the founder
  { id: SECTION_IDS.founder, label: ui.nav.who },
  { id: 'news', label: ui.nav.news, href: '/news' },
  // "Contattaci", last and highlighted → the five "Come vuoi iniziare?" cards
  { id: SECTION_IDS.connect, label: ui.nav.contact, cta: true },
];

/** All anchors observed by the scroll-spy (used to keep position on language switch). */
export const allSectionIds = Object.values(SECTION_IDS);

/** The nav item to highlight for the section in view. */
export const navIdFor = (items: NavItem[], section: string | null) =>
  section ? (items.find((i) => i.id === section || i.also?.includes(section))?.id ?? null) : null;
