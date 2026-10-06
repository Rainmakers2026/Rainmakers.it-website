'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Locale } from '@/content/types';
import type { HeaderCopy } from '@/lib/client-copy';
import { rainforest } from '@/content/shared';
import { track } from '@/lib/analytics';
import { allSectionIds, navItems } from '@/lib/nav';
import { Logo } from './Logo';
import { ArrowUpRight, Close, Menu } from './icons';

export function Header({ dict, locale, home = true }: { dict: HeaderCopy; locale: Locale; home?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
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

  // Scroll-spy: tracks the section in view (nav highlight + language switch keeps position).
  useEffect(() => {
    if (!home || !('IntersectionObserver' in window)) return;
    const els = allSectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            activeRef.current = e.target.id;
            setActive(e.target.id);
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    const top = document.getElementById('top');
    const topIo = top
      ? new IntersectionObserver(([e]) => {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            activeRef.current = null;
            setActive(null);
          }
        }, { threshold: [0.5] })
      : null;
    if (top) topIo?.observe(top);
    return () => {
      io.disconnect();
      topIo?.disconnect();
    };
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

  /** PRD §32: switching language keeps the user in the same section. */
  const switchLanguage = (e: MouseEvent<HTMLAnchorElement>) => {
    const section = home ? activeRef.current : null;
    track('language_switch', { from: locale, to: other, section: section ?? 'top' });
    if (home) {
      e.preventDefault();
      window.location.href = `/${other}${section ? `#${section}` : ''}`;
    }
  };

  return (
    <header className={`site-header ${scrolled || !home ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="container site-header__inner">
        <a href={home ? '#top' : `/${locale}`} className="site-header__brand" aria-label="Rainmakers — home">
          <Logo variant="white" />
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
          <a className="lang-switch" href={`/${other}`} hrefLang={other} lang={other} onClick={switchLanguage} aria-label={dict.a11y.languageSwitch}>
            {other.toUpperCase()}
          </a>
          <a
            href={rainforest.urlFor(locale)}
            target="_blank"
            rel="noopener"
            className="btn btn--primary btn--sm site-header__cta"
            data-track="rainforest_cta_click"
            data-location="header"
          >
            {dict.cta.explore}
            <ArrowUpRight aria-hidden />
            <span className="sr-only"> {dict.a11y.external}</span>
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
          href={rainforest.urlFor(locale)}
          target="_blank"
          rel="noopener"
          className="btn btn--primary btn--block"
          data-track="rainforest_cta_click"
          data-location="mobile_menu"
        >
          {dict.cta.explore}
          <ArrowUpRight aria-hidden />
          <span className="sr-only"> {dict.a11y.external}</span>
        </a>
        <a className="mobile-menu__lang" href={`/${other}`} hrefLang={other} lang={other} onClick={switchLanguage}>
          {dict.a11y.languageSwitch}
        </a>
      </div>
    </header>
  );
}
