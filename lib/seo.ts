import type { Metadata } from 'next';
import type { Dictionary, Locale } from '@/content/types';
import { isPlaceholder } from '@/content/governance';
import { brand, facts, rainforest, site, socialProfiles } from '@/content/shared';
import { ogLocale, otherLocale } from './i18n';

export const localeUrl = (locale: Locale, path = '') => `${site.url}/${locale}${path}`;

export function buildMetadata(dict: Dictionary, path = '', overrides: Partial<Metadata> = {}): Metadata {
  const locale = dict.locale;
  const url = localeUrl(locale, path);
  return {
    metadataBase: new URL(site.url),
    title: dict.meta.title,
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    applicationName: site.name,
    alternates: {
      canonical: url,
      languages: { it: localeUrl('it', path), en: localeUrl('en', path), 'x-default': localeUrl('it', path) },
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      url,
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      locale: ogLocale(locale),
      alternateLocale: [ogLocale(otherLocale(locale))],
    },
    twitter: { card: 'summary_large_image', title: dict.meta.ogTitle, description: dict.meta.ogDescription },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
    ...overrides,
  };
}

/**
 * schema.org graph (PRD §23–24) built ONLY from verified facts:
 * no address, VAT, email or social profiles until confirmed.
 */
export function buildJsonLd(dict: Dictionary) {
  const locale = dict.locale;
  const lang = locale === 'it' ? 'it-IT' : 'en';
  const orgId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;
  const rainforestId = `${rainforest.url}/#dataset`;
  const pageUrl = localeUrl(locale);
  const faq = dict.faq.items.filter((i) => !isPlaceholder(i.a) && !isPlaceholder(i.q));

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': orgId,
    name: site.name,
    alternateName: ['Rainmakers Italia', 'Rainmakers Italy', 'Nuvolab'],
    url: site.url,
    description: dict.about.definition,
    slogan: dict.about.mission,
    founder: { '@type': 'Person', name: dict.about.founder.name, sameAs: 'https://www.linkedin.com/in/italianrainmaker' },
    memberOf: { '@type': 'Organization', name: 'InnovUp' },
    foundingDate: String(facts.foundingYear.value),
    foundingLocation: { '@type': 'Place', name: 'Milano, Italia' },
    areaServed: { '@type': 'Country', name: 'Italy' },
    audience: { '@type': 'Audience', audienceType: 'Entrepreneurs, founders, startups, scaleups, investors, corporates, innovation professionals' },
    knowsAbout: ['Innovation advisory', 'Open innovation', 'Venture building', 'Startup acceleration', 'Italian innovation ecosystem', 'Entrepreneurship', 'Startups', 'Scaleups', 'Entrepreneurial community', 'Ecosystem intelligence', 'Meaningful innovation'],
    owns: { '@id': rainforestId },
  };
  if (brand.available) organization.logo = { '@type': 'ImageObject', url: `${site.url}${brand.files.squarePng}` };
  if (socialProfiles.length) organization.sameAs = socialProfiles.map((p) => p.url);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'Dataset',
        '@id': rainforestId,
        name: 'Italian Rainforest',
        url: rainforest.urlFor(locale),
        description: dict.rainforest.text,
        creator: { '@id': orgId },
        isAccessibleForFree: true,
        license: 'Copyleft, non-commercial use',
        spatialCoverage: { '@type': 'Place', name: 'Italy' },
        keywords: ['Italian innovation ecosystem map', 'Italian startup ecosystem', 'venture capital Italy', 'incubators and accelerators Italy'],
      },
      { '@type': 'WebSite', '@id': websiteId, url: site.url, name: site.name, inLanguage: ['it-IT', 'en'], publisher: { '@id': orgId } },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: dict.meta.title,
        description: dict.meta.description,
        inLanguage: lang,
        isPartOf: { '@id': websiteId },
        about: { '@id': orgId },
        mentions: { '@id': rainforestId },
      },
      ...(faq.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              inLanguage: lang,
              mainEntity: faq.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
            },
          ]
        : []),
    ],
  };
}
