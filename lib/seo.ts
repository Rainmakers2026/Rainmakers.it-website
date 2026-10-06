import type { Metadata } from 'next';
import type { Dictionary, Locale } from '@/content/types';
import { contacts, legalEntity, rainforest, site, socialProfiles } from '@/content/shared';
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
      languages: {
        it: localeUrl('it', path),
        en: localeUrl('en', path),
        'x-default': localeUrl('it', path),
      },
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
    twitter: {
      card: 'summary_large_image',
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
    ...overrides,
  };
}

/**
 * schema.org graph (PRD §30–31). Explicit, semantic statements so search and
 * generative engines understand: who Rainmakers is, what it offers, for whom,
 * where, what Italian Rainforest is and how the two relate.
 */
export function buildJsonLd(dict: Dictionary) {
  const locale = dict.locale;
  const orgId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;
  const rainforestId = `${rainforest.url}/#dataset`;
  const pageUrl = localeUrl(locale);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: site.name,
        alternateName: ['Rainmakers Italia', 'Rainmakers Italy'],
        legalName: legalEntity.name,
        url: site.url,
        logo: { '@type': 'ImageObject', url: `${site.url}/brand/logo-square-color.png` },
        description: dict.about.definition,
        foundingDate: String(site.foundingYear),
        foundingLocation: { '@type': 'Place', name: 'Milano, Italia' },
        address: {
          '@type': 'PostalAddress',
          streetAddress: legalEntity.street,
          postalCode: legalEntity.postalCode,
          addressLocality: legalEntity.city,
          addressCountry: 'IT',
        },
        vatID: `IT${legalEntity.vat}`,
        email: contacts.general,
        areaServed: { '@type': 'Country', name: 'Italy' },
        knowsAbout: [
          'Entrepreneurship',
          'Startups',
          'Scaleups',
          'Innovation ecosystem',
          'Italian startup ecosystem',
          'Business networking',
          'Meaningful innovation',
        ],
        sameAs: socialProfiles.map((p) => p.url),
        owns: { '@id': rainforestId },
      },
      {
        '@type': 'Dataset',
        '@id': rainforestId,
        name: 'Italian Rainforest',
        url: rainforest.urlFor(locale),
        description: dict.faq.items.find((i) => i.q.includes('Rainforest'))?.a ?? dict.rainforest.text,
        creator: { '@id': orgId },
        isAccessibleForFree: true,
        license: 'Copyleft, non-commercial use',
        spatialCoverage: { '@type': 'Place', name: 'Italy' },
        keywords: ['Italian innovation ecosystem map', 'Italian startup database', 'venture capital Italy', 'incubators Italy'],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: site.url,
        name: site.name,
        inLanguage: ['it-IT', 'en'],
        publisher: { '@id': orgId },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: dict.meta.title,
        description: dict.meta.description,
        inLanguage: locale === 'it' ? 'it-IT' : 'en',
        isPartOf: { '@id': websiteId },
        about: { '@id': orgId },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${pageUrl}/opengraph-image` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        inLanguage: locale === 'it' ? 'it-IT' : 'en',
        mainEntity: dict.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };
}
