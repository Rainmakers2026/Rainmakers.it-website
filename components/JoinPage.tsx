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
                ? 'Vuoi accelerare la tua startup o lavorare con noi? Scegli il tuo percorso: bastano pochi minuti.'
                : 'Want to accelerate your startup or work with us? Choose your path: it only takes a few minutes.'}
            </p>
          </header>
          <JoinOptions locale={locale} paths={dict.final.paths} />
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
