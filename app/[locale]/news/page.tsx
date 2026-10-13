import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { NewsPage } from '@/components/NewsPage';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // Placeholder content only: not indexed (and not in the sitemap) until real articles are published
  return buildMetadata(getDictionary(locale), '/news', {
    title: 'News | Rainmakers',
    description: locale === 'it' ? 'Articoli, tech news, eventi e open venture builder dall’ecosistema Rainmakers.' : 'Articles, tech news, events and open venture-building from the Rainmakers ecosystem.',
    robots: { index: false, follow: true },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <NewsPage locale={locale} />;
}
