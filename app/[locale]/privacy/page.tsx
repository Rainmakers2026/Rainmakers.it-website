import { headerCopy } from '@/lib/client-copy';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata(dict, '/privacy', {
    title: `${dict.privacy.title} | Rainmakers`,
    // Keep out of the index until the legal text is validated.
    robots: { index: false, follow: true },
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const p = dict.privacy;

  return (
    <>
      <a href="#main" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="legal-page" tabIndex={-1}>
        <div className="container container--narrow">
          <p className="draft-banner" role="note">
            {p.draftNotice}
          </p>
          <h1 className="h2">{p.title}</h1>
          <p className="muted">{p.updated}</p>
          {p.sections.map((s) => (
            <section key={s.title} className="legal-page__section">
              <h2 className="h3">{s.title}</h2>
              {s.body.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </section>
          ))}
          <p>
            <a className="link-arrow" href={`/${locale}`}>
              {p.back}
            </a>
          </p>
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
