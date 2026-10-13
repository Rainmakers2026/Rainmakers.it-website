import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { JoinPage } from '@/components/JoinPage';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // Self-referencing canonical + it/en alternates for /join (not the homepage's)
  return buildMetadata(getDictionary(locale), '/join', {
    title: locale === 'it' ? 'Join the Tribe: invia pitch o CV | Rainmakers' : 'Join the Tribe: send your pitch or CV | Rainmakers',
    description:
      locale === 'it'
        ? 'Hai una startup o vuoi lavorare con Rainmakers? Inviaci il tuo pitch o il tuo CV: il team ti ricontatterà.'
        : 'Have a startup or want to work with Rainmakers? Send us your pitch or your CV and the team will get back to you.',
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <JoinPage locale={locale} />;
}
