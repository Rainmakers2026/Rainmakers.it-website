import { tribeStats } from '@/content/data/tribe';
import { advisory } from '@/content/data/advisory';
import { rainforest } from '@/content/shared';
import it from '@/content/it';
import en from '@/content/en';
import type { Dictionary, Locale } from '@/content/types';

const dictionaries: Record<Locale, Dictionary> = { it, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const otherLocale = (locale: Locale): Locale => (locale === 'it' ? 'en' : 'it');

export const ogLocale = (locale: Locale) => (locale === 'it' ? 'it_IT' : 'en_GB');

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-GB').format(value);
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  }).format(new Date(`${iso}T12:00:00Z`));
}


/**
 * Counts derived from the data files, so copy never drifts from the data ({exits}, {active}, {advisory}); {rfOrgs} and
 * {rfItaly} are the Italian Rainforest database figures (content/shared.ts → rainforest.stats, updated 2026-11-17).
 */
const tokens: Record<string, () => string> = {
  exits: () => String(tribeStats.exits),
  active: () => String(tribeStats.active),
  minority: () => String(tribeStats.minority),
  advisory: () => String(advisory.length),
  rfOrgs: () => String(rainforest.stats.activeOrganisations),
  rfItaly: () => String(rainforest.stats.italy),
};

export function fillTokens(text: string, extra: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in extra ? String(extra[k]) : tokens[k] ? tokens[k]() : m));
}
