import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { HomePage } from '@/components/HomePage';

/** Fully static page (no per-request data). */
export const dynamic = 'force-static';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage dict={getDictionary(locale)} locale={locale} />;
}
