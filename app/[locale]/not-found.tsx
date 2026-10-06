import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';

// not-found doesn't receive params; Italian is the primary language, with an English line below.
export default function NotFound() {
  const it = getDictionary('it').ui.notFound;
  const en = getDictionary('en').ui.notFound;
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
          <Link className="btn btn--primary" href="/it">
            {it.back}
          </Link>{' '}
          <Link className="btn btn--ghost" href="/en" lang="en">
            {en.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
