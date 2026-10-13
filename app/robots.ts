import type { MetadataRoute } from 'next';
import { site } from '@/content/shared';

export default function robots(): MetadataRoute.Robots {
  return {
    // Generative-engine crawlers are explicitly welcome (PRD §17.4 — GEO). APIs are not content.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
