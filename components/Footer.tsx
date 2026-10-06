import type { Dictionary, Locale } from '@/content/types';
import { contacts, legalEntity, rainforest, socialProfiles } from '@/content/shared';
import { Logo } from './Logo';
import { navItems } from '@/lib/nav';

export function Footer({ dict, locale, home = true }: { dict: Dictionary; locale: Locale; home?: boolean }) {
  const prefix = home ? '' : `/${locale}`;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo />
          <p>{dict.footer.tagline}</p>
        </div>

        <nav aria-label={dict.footer.explore}>
          <h2 className="site-footer__title">{dict.footer.explore}</h2>
          <ul>
            {navItems(dict).map((i) => (
              <li key={i.id}>
                <a href={`${prefix}#${i.id}`}>{i.label}</a>
              </li>
            ))}
            <li>
              <a href={rainforest.urlFor(locale)} target="_blank" rel="noopener" data-track="rainforest_cta_click" data-location="footer">
                Italian Rainforest<span className="sr-only"> {dict.a11y.external}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__title">{dict.footer.contacts}</h2>
          <ul>
            <li>
              <span className="muted">{dict.footer.generalEmailLabel}: </span>
              <a href={`mailto:${contacts.general}`} data-track="contact_cta_click" data-location="footer_email">
                {contacts.general}
              </a>
            </li>
            <li>
              <span className="muted">{dict.footer.rainforestEmailLabel}: </span>
              <a href={`mailto:${contacts.rainforest}`}>{contacts.rainforest}</a>
            </li>
            {socialProfiles.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener me">
                  {s.name}
                  <span className="sr-only"> {dict.a11y.external}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__title">{dict.footer.legal}</h2>
          <address className="site-footer__legal">
            {legalEntity.name}
            <br />
            {legalEntity.street}, {legalEntity.postalCode} {legalEntity.city}
            <br />
            P.IVA {legalEntity.vat}
          </address>
          <ul>
            <li>
              <a href={`/${locale}/privacy`}>{dict.footer.privacy}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>
          © {year} Rainmakers. {dict.footer.rights}
        </p>
        <p>
          <a href="/it" hrefLang="it" lang="it" aria-current={locale === 'it' ? 'page' : undefined}>
            Italiano
          </a>
          {' · '}
          <a href="/en" hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>
            English
          </a>
        </p>
      </div>
    </footer>
  );
}
