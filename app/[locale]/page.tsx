import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { getCommunities } from '@/lib/supabase/communities';
import { HomePage } from '@/components/HomePage';

/** Static page, re-generated at most every 5 minutes so new communities in Supabase appear without a deploy. */
export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { items } = await getCommunities();
  return <HomePage dict={getDictionary(locale)} locale={locale} communities={items} />;
}
