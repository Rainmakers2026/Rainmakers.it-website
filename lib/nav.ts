import type { UiCopy } from '@/content/types';
import { SECTION_IDS } from '@/content/types';

/** One-page navigation targets. Anchors are identical in both languages. */
export const navItems = (ui: Pick<UiCopy, 'nav'>) => [
  { id: SECTION_IDS.why, label: ui.nav.why, href: undefined },
  { id: SECTION_IDS.founder, label: ui.nav.founder, href: undefined },
  { id: SECTION_IDS.track, label: ui.nav.track, href: undefined },
  { id: SECTION_IDS.community, label: ui.nav.community, href: undefined },
  { id: SECTION_IDS.rainforest, label: ui.nav.rainforest, href: undefined },
  { id: SECTION_IDS.connect, label: ui.nav.connect, href: undefined },
  { id: 'news', label: ui.nav.news, href: '/news' },
];

/** All anchors observed by the scroll-spy (used to keep position on language switch). */
export const allSectionIds = Object.values(SECTION_IDS);
