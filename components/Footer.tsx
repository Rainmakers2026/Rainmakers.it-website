import Link from 'next/link';
import type { Dictionary, Locale } from '@/content/types';
import { facts, socialProfiles, substack } from '@/content/shared';
import { isPlaceholder } from '@/content/governance';
import { navItems } from '@/lib/nav';
import { Logo } from './Logo';
import { NewsletterSignup } from './NewsletterSignup';
import { Facebook, Instagram, LinkedIn, XLogo } from './icons';

const socialIcons = { facebook: Facebook, instagram: Instagram, linkedin: LinkedIn, x: XLogo };

/**
 * Footer (PRD §48), aligned with the 2026-10-27 header: the same sections (Perché · Come · Cosa · Chi · News ·
 * Contattaci; no external Italian Rainforest link and no duplicate "Contattaci" since 2026-10-27), contacts
 * (info@rainmakers.it, Substack), the newsletter, and the legal links in the bottom bar. No address or company data
 * until confirmed as current.
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
          {socialProfiles.length ? (
            <div className="social">
              <p className="social__label">{f.follow}</p>
              <ul className="social-links">
                {socialProfiles.map((s) => {
                  const Icon = socialIcons[s.icon];
                  // Placeholder profiles keep a dummy link until the real URL is provided (content/shared.ts)
                  const pending = isPlaceholder(s.url);
                  return (
                    <li key={s.name}>
                      <a
                        className={`social-links__${s.icon}`}
                        href={pending ? '#social-link-to-be-provided' : s.url}
                        {...(pending ? { 'data-placeholder': 'true', title: dict.ui.placeholderBadge } : { target: '_blank', rel: 'noopener me' })}
                        aria-label={pending ? `Rainmakers — ${s.name}` : `Rainmakers — ${s.name} ${dict.ui.a11y.external}`}
                      >
                        <Icon aria-hidden width={24} height={24} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <nav aria-label={f.explore}>
          <h2 className="site-footer__title">{f.explore}</h2>
          <ul>
            {navItems(dict.ui).map((i) => (
              <li key={i.id}>
                <a href={i.href ? `/${locale}${i.href}` : `${prefix}#${i.id}`}>{i.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__title">{f.contact}</h2>
          <ul>
            <li>
              <span className="muted">{f.emailLabel}: </span>
              <a href={`mailto:${facts.contactEmail.value}`}>{facts.contactEmail.value}</a>
            </li>
            <li>
              <a href={substack.url} target="_blank" rel="noopener">
                {substack.name} {f.onSubstack} ↗<span className="sr-only"> {dict.ui.a11y.external}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="site-footer__title">{f.newsletter}</h2>
          <p className="site-footer__text">{f.newsletterText}</p>
          <NewsletterSignup locale={locale} source="footer" />
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>
          © {year} Rainmakers. {f.rights}
        </p>
        <nav aria-label={f.legal} className="site-footer__legal">
          <Link href={`/${locale}/privacy`}>{f.privacy}</Link>
          <Link href={`/${locale}/cookie`}>{f.cookies}</Link>
        </nav>
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
