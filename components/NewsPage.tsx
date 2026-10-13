import type { Locale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { headerCopy } from '@/lib/client-copy';
import { Header } from './Header';
import { Footer } from './Footer';
import { NewsletterSignup } from './NewsletterSignup';
import { substack } from '@/content/shared';

const categories = {
  it: ['Articoli', 'Tech news', 'Eventi', 'Open venture builder'],
  en: ['Articles', 'Tech news', 'Events', 'Open venture builder'],
} as const;

export function NewsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const it = locale === 'it';
  const titles = it
    ? [
        ['Articoli', 'Prossimamente: idee, guide e prospettive dal network Rainmakers.'],
        ['Tech news', 'Prossimamente: le novità tech che contano per chi costruisce impresa.'],
        ['Eventi', 'Prossimamente: appuntamenti e incontri dell’ecosistema italiano.'],
        ['Open venture builder', 'Prossimamente: opportunità e iniziative aperte per founder e startup.'],
      ]
    : [
        ['Articles', 'Coming soon: ideas, guides and perspectives from the Rainmakers network.'],
        ['Tech news', 'Coming soon: technology updates that matter to builders.'],
        ['Events', 'Coming soon: meetups and events across the Italian ecosystem.'],
        ['Open venture builder', 'Coming soon: open opportunities and initiatives for founders and startups.'],
      ];
  return (
    <>
      <Header dict={headerCopy(dict)} locale={locale} home={false} />
      <main id="main" className="content-page news-page">
        <div className="container content-page__inner">
          <p className="eyebrow">{it ? 'Dall’ecosistema' : 'From the ecosystem'}</p>
          <h1 className="h2">{it ? 'News' : 'News'}</h1>
          <p className="lead">
            {it
              ? 'Articoli, novità tech, eventi e opportunità di open venture building: una finestra sull’innovazione italiana.'
              : 'Articles, tech news, events and open venture-building opportunities: a window into Italian innovation.'}
          </p>
          <div className="news__tags" aria-label={it ? 'Categorie' : 'Categories'}>
            {categories[locale].map((category, index) => (
              <a className="news-tag" href={`#news-${index}`} key={category}>{category}</a>
            ))}
          </div>
          <div className="news__grid">
            {titles.map(([category, description], index) => (
              <article className="news-card" id={`news-${index}`} key={category}>
                <span className="news-tag">{categories[locale][index]}</span>
                <h2>{it ? '[Titolo in arrivo]' : '[Article title coming soon]'}</h2>
                <p>{description}</p>
                <span className="ph">{it ? '[Articolo da pubblicare]' : '[Article to be published]'}</span>
              </article>
            ))}
          </div>
          <aside className="news__newsletter">
            <p className="eyebrow">{it ? 'Una volta al mese' : 'Once a month'}</p>
            <h2>{it ? 'I highlights dell’ecosistema, in un clic.' : 'Ecosystem highlights, in one click.'}</h2>
            <p>
              {it
                ? 'Iscriviti per ricevere gli highlight mensili e i link agli ultimi articoli, alle novità tech e agli eventi.'
                : 'Subscribe for a monthly roundup with the latest articles, tech news and events.'}
            </p>
            <NewsletterSignup locale={locale} source="news" />
          </aside>
          <p className="news__founder-link">
            <a className="link-arrow" href={substack.url} target="_blank" rel="noopener">
              {it ? `Segui il blog ${substack.name} su Substack` : `Follow the ${substack.name} blog on Substack`}
              <span className="sr-only"> {dict.ui.a11y.external}</span>
            </a>
          </p>
        </div>
      </main>
      <Footer dict={dict} locale={locale} home={false} />
    </>
  );
}
