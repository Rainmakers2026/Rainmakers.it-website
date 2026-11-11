import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { headerCopy } from '@/lib/client-copy';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NewsletterUnsubscribe } from '@/components/NewsletterUnsubscribe';

/** Personal, link-based page: never indexed, never cached. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'it' ? 'Annulla iscrizione | Rainmakers' : 'Unsubscribe | Rainmakers',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ c?: string; t?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { c, t } = await searchParams;
  const dict = getDictionary(locale);
  const contact = typeof c === 'string' && /^[0-9a-f-]{36}$/.test(c) ? c : null;
  const signature = typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t) ? t : null;
  return (
    <>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="content-page">
        <div className="container container--narrow content-page__inner">
          <NewsletterUnsubscribe locale={locale} contact={contact} signature={signature} />
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
