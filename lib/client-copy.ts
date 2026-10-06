import type { Dictionary } from '@/content/types';

/**
 * Client components receive only the copy they render, so the full dictionary
 * is never serialized into the page's client payload.
 */
export type HeaderCopy = Pick<Dictionary, 'nav' | 'a11y'> & { cta: Pick<Dictionary['cta'], 'join'> };

export const headerCopy = (dict: Dictionary): HeaderCopy => ({
  nav: dict.nav,
  a11y: dict.a11y,
  cta: { join: dict.cta.join },
});

export type LeadFormCopy = Pick<Dictionary, 'form' | 'thanks' | 'cta'> & {
  a11y: Pick<Dictionary['a11y'], 'external'>;
  community: Pick<Dictionary['community'], 'publicCommunityCta'>;
};

export const leadFormCopy = (dict: Dictionary): LeadFormCopy => ({
  form: dict.form,
  thanks: dict.thanks,
  cta: dict.cta,
  a11y: { external: dict.a11y.external },
  community: { publicCommunityCta: dict.community.publicCommunityCta },
});
