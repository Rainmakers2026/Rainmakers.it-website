import type { Locale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { headerCopy } from '@/lib/client-copy';
import { Header } from './Header';
import { Footer } from './Footer';
import { JoinOptions } from './JoinOptions';

export function JoinPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const it = locale === 'it';
  return (
    <>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="content-page join-page">
        <div className="container content-page__inner">
          <header className="join-page__heading">
            <p className="eyebrow">Rainmakers Tribe</p>
            <h1>{it ? 'Entra nella Tribe' : 'Join the Tribe'}</h1>
            <p className="lead">
              {it
                ? 'Hai un progetto startup da condividere o vuoi lavorare con noi? Scegli come entrare in contatto con Rainmakers.'
                : 'Have a startup project to share or want to work with us? Choose how to get in touch with Rainmakers.'}
            </p>
          </header>
          <JoinOptions locale={locale} />
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
