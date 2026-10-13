import type { MetadataRoute } from 'next';
import { site } from '@/content/shared';

/**
 * Indexable pages only. /news is left out (placeholder, noindex) until real articles exist;
 * privacy/cookie are noindex until the legal text is validated.
 * lastModified: date of the last content change — update it when a page's copy changes
 * (a build-time date would tell crawlers every page changed on every deploy).
 */
const PAGES: { path: string; lastModified: string }[] = [
  { path: '', lastModified: '2026-10-12' },
  { path: '/join', lastModified: '2026-10-12' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['it', 'en'] as const;
  return locales.flatMap((locale) =>
    PAGES.map(({ path, lastModified }) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: path ? 0.7 : locale === 'it' ? 1 : 0.9,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((alternate) => [alternate, `${site.url}/${alternate}${path}`])),
          'x-default': `${site.url}/it${path}`,
        },
      },
    })),
  );
}
