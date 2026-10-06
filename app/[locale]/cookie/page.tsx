import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import { LegalPage } from '@/components/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  // Not indexed until the legal text is validated.
  return buildMetadata(dict, '/cookie', { title: `${dict.legal.cookies.title} | Rainmakers`, robots: { index: false, follow: true } });
}

export default async function CookiePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return <LegalPage dict={dict} locale={locale} page={dict.legal.cookies} />;
}
