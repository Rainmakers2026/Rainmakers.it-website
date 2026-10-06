import type { UiCopy } from '@/content/types';
import { SECTION_IDS } from '@/content/types';

/** One-page navigation targets. Anchors are identical in both languages. */
export const navItems = (ui: Pick<UiCopy, 'nav'>) => [
  { id: SECTION_IDS.why, label: ui.nav.why },
  { id: SECTION_IDS.access, label: ui.nav.access },
  { id: SECTION_IDS.rainforest, label: ui.nav.rainforest },
  { id: SECTION_IDS.model, label: ui.nav.model },
  { id: SECTION_IDS.community, label: ui.nav.community },
  { id: SECTION_IDS.connect, label: ui.nav.connect },
  { id: SECTION_IDS.tribe, label: ui.nav.track },
];

/** All anchors observed by the scroll-spy (used to keep position on language switch). */
export const allSectionIds = Object.values(SECTION_IDS);
