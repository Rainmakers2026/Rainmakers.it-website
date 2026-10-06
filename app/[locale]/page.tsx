import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { HomePage } from '@/components/HomePage';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage dict={getDictionary(locale)} locale={locale} />;
}
