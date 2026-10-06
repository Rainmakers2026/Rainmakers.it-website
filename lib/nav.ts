import type { Dictionary } from '@/content/types';

/** One-page navigation targets (PRD §44). */
export const navItems = (dict: Pick<Dictionary, 'nav'>) => [
  { id: 'why', label: dict.nav.why },
  { id: 'value', label: dict.nav.value },
  { id: 'ecosystem', label: dict.nav.ecosystem },
  { id: 'communities', label: dict.nav.communities },
  { id: 'about', label: dict.nav.about },
];
