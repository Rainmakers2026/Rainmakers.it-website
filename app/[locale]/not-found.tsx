import { getDictionary } from '@/lib/i18n';

// not-found doesn't receive params; Italian is the primary language, with an English line below.
export default function NotFound() {
  const it = getDictionary('it').notFound;
  const en = getDictionary('en').notFound;
  return (
    <main id="main" className="legal-page not-found">
      <div className="container container--narrow">
        <p className="eyebrow">404</p>
        <h1 className="h2">{it.title}</h1>
        <p>{it.text}</p>
        <p lang="en" className="muted">
          {en.title} — {en.text}
        </p>
        <p>
          <a className="btn btn--primary" href="/it">
            {it.back}
          </a>{' '}
          <a className="btn btn--ghost" href="/en" lang="en">
            {en.back}
          </a>
        </p>
      </div>
    </main>
  );
}
