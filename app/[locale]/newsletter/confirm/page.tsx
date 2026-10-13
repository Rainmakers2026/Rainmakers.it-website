import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { headerCopy } from '@/lib/client-copy';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NewsletterConfirm } from '@/components/NewsletterConfirm';

/** Personal, token-based page: never indexed, never cached. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'it' ? 'Conferma iscrizione | Rainmakers' : 'Confirm subscription | Rainmakers',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { token } = await searchParams;
  const dict = getDictionary(locale);
  return (
    <>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="content-page">
        <div className="container container--narrow content-page__inner">
          <NewsletterConfirm locale={locale} token={typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null} />
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
