import type { Dictionary, LegalPageCopy, Locale } from '@/content/types';
import { headerCopy } from '@/lib/client-copy';
import { Header } from './Header';
import { Footer } from './Footer';
import { PhText } from './PhText';

/** Shared layout for privacy and cookie policies (drafts until legally validated). */
export function LegalPage({ dict, locale, page }: { dict: Dictionary; locale: Locale; page: LegalPageCopy }) {
  return (
    <>
      <a href="#main" className="skip-link">
        {dict.ui.a11y.skipToContent}
      </a>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="legal-page" tabIndex={-1}>
        <div className="container container--narrow">
          <p className="draft-banner" role="note">
            {page.draftNotice}
          </p>
          <h1 className="h2">{page.title}</h1>
          <PhText as="p" className="muted" value={page.updated} badge={dict.ui.placeholderBadge} />
          {page.sections.map((s) => (
            <section key={s.title} className="legal-page__section">
              <h2 className="h3">{s.title}</h2>
              {s.body.map((para) => (
                <PhText key={para} as="p" value={para} badge={dict.ui.placeholderBadge} />
              ))}
            </section>
          ))}
          <p>
            <a className="link-arrow" href={`/${locale}`}>
              {page.back}
            </a>
          </p>
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
