import it from '@/content/it';
import en from '@/content/en';
import type { Dictionary, Locale } from '@/content/types';
import { rainforest } from '@/content/shared';

const dictionaries: Record<Locale, Dictionary> = { it, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const otherLocale = (locale: Locale): Locale => (locale === 'it' ? 'en' : 'it');

export const ogLocale = (locale: Locale) => (locale === 'it' ? 'it_IT' : 'en_GB');

/** Replaces {tokens} in copy with live values, so numbers live in one place (content/shared.ts). */
const tokens: Record<string, (locale: Locale) => string> = {
  rainforestTotal: (locale) => formatNumber(rainforest.stats.activeOrganisations, locale),
};

export function interpolate(text: string, locale: Locale): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (tokens[key] ? tokens[key](locale) : match));
}

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
