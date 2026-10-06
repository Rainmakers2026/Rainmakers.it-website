import type { Dictionary } from '@/content/types';

/**
 * Client components receive only the copy they render, so the full dictionary
 * is never serialized into the page's client payload.
 */
export type HeaderCopy = Pick<Dictionary['ui'], 'a11y' | 'nav'> & { cta: Pick<Dictionary['ui']['cta'], 'explore'> };

export const headerCopy = (dict: Dictionary): HeaderCopy => ({
  a11y: dict.ui.a11y,
  nav: dict.ui.nav,
  cta: { explore: dict.ui.cta.explore },
});

export type LeadFormCopy = Pick<Dictionary['connect'], 'form' | 'success'> & {
  cta: Pick<Dictionary['ui']['cta'], 'exploreRainforest' | 'community'>;
  external: string;
};

export const leadFormCopy = (dict: Dictionary): LeadFormCopy => ({
  form: dict.connect.form,
  success: dict.connect.success,
  cta: { exploreRainforest: dict.ui.cta.exploreRainforest, community: dict.ui.cta.community },
  external: dict.ui.a11y.external,
});
