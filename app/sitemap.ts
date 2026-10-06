import type { MetadataRoute } from 'next';
import { site } from '@/content/shared';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { it: `${site.url}/it`, en: `${site.url}/en` };
  return (['it', 'en'] as const).map((locale) => ({
    url: `${site.url}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: locale === 'it' ? 1 : 0.9,
    alternates: { languages },
  }));
}
