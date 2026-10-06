'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Locale } from '@/content/types';
import type { HeaderCopy } from '@/lib/client-copy';
import { Logo } from './Logo';
import { Close, Menu } from './icons';
import { track } from '@/lib/analytics';
import { navItems } from '@/lib/nav';


export function Header({ dict, locale, home = true }: { dict: HeaderCopy; locale: Locale; home?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const other: Locale = locale === 'it' ? 'en' : 'it';
  const items = navItems(dict);
  const prefix = home ? '' : `/${locale}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    if (!home || !('IntersectionObserver' in window)) return;
    const ids = [...items.map((i) => i.id), 'join'];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  // Mobile menu: lock scroll, close on Escape, keep focus inside.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('menu-open');
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && panel) {
        const focusables = [...panel.querySelectorAll<HTMLElement>('a, button')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchLanguage = (e: MouseEvent<HTMLAnchorElement>) => {
    track('language_switch', { from: locale, to: other });
    if (home && window.location.hash) {
      e.preventDefault();
      window.location.href = `/${other}${window.location.hash}`;
    }
  };

  return (
    <header className={`site-header ${scrolled || !home ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="container site-header__inner">
        <a href={home ? '#top' : `/${locale}`} className="site-header__brand" aria-label="Rainmakers — home">
          <Logo />
        </a>

        <nav className="site-nav" aria-label={dict.a11y.mainNav}>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a href={`${prefix}#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a
            className="lang-switch"
            href={`/${other}`}
            hrefLang={other}
            lang={other}
            onClick={switchLanguage}
            aria-label={dict.a11y.languageSwitch}
          >
            {other.toUpperCase()}
          </a>
          <a
            href={`${prefix}#join`}
            className="btn btn--primary btn--sm site-header__cta"
            data-track="join_cta_click"
            data-location="header"
            data-intent="join"
          >
            {dict.cta.join}
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.a11y.closeMenu : dict.a11y.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        className="mobile-menu"
        hidden={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false);
        }}
      >
        <ul>
          {items.map((item, i) => (
            <li key={item.id} style={{ '--i': i } as CSSProperties}>
              <a href={`${prefix}#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ul>
        <a
          href={`${prefix}#join`}
          className="btn btn--primary btn--block"
          data-track="join_cta_click"
          data-location="mobile_menu"
          data-intent="join"
        >
          {dict.cta.join}
        </a>
        <a className="mobile-menu__lang" href={`/${other}`} hrefLang={other} lang={other} onClick={switchLanguage}>
          {dict.a11y.languageSwitch}
        </a>
      </div>
    </header>
  );
}
