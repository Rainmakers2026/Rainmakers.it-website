import Link from 'next/link';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { facts, rainforest, socialProfiles } from '@/content/shared';
import { navItems } from '@/lib/nav';
import { Logo } from './Logo';

/**
 * Footer (PRD §48). No address, email or company data until confirmed as current:
 * contact goes through the form; only the verified Italian Rainforest address is shown.
 */
export function Footer({ dict, locale, home = true }: { dict: Dictionary; locale: Locale; home?: boolean }) {
  const prefix = home ? '' : `/${locale}`;
  const f = dict.footer;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo variant="white" />
          <p>{f.tagline}</p>
        </div>

        <nav aria-label={f.explore}>
          <h2 className="site-footer__title">{f.explore}</h2>
          <ul>
            {navItems(dict.ui).map((i) => (
              <li key={i.id}>
                <a href={`${prefix}#${i.id}`}>{i.label}</a>
              </li>
            ))}
            <li>
              <a href={rainforest.urlFor(locale)} target="_blank" rel="noopener" data-track="rainforest_cta_click" data-location="footer">
                {dict.ui.cta.exploreRainforest} ↗<span className="sr-only"> {dict.ui.a11y.external}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__title">{f.contact}</h2>
          <ul>
            <li>
              <a href={`${prefix}#${SECTION_IDS.connect}`} data-track="contact_cta_click" data-location="footer">
                {f.contactCta}
              </a>
            </li>
            <li>
              <span className="muted">{f.rainforestEmailLabel}: </span>
              <a href={`mailto:${facts.rainforestEmail.value}`}>{facts.rainforestEmail.value}</a>
            </li>
            {socialProfiles.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener me">
                  {s.name}
                  <span className="sr-only"> {dict.ui.a11y.external}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__title">{f.legal}</h2>
          <ul>
            <li>
              <Link href={`/${locale}/privacy`}>{f.privacy}</Link>
            </li>
            <li>
              <Link href={`/${locale}/cookie`}>{f.cookies}</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>
          © {year} Rainmakers. {f.rights}
        </p>
        <p>
          <span className="sr-only">{f.language}: </span>
          <Link href="/it" hrefLang="it" lang="it" aria-current={locale === 'it' ? 'page' : undefined}>
            Italiano
          </Link>
          {' · '}
          <Link href="/en" hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>
            English
          </Link>
        </p>
      </div>
    </footer>
  );
}
