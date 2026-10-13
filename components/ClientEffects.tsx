'use client';

import { useEffect } from 'react';
import type { Locale } from '@/content/types';
import { track, type AnalyticsEvent } from '@/lib/analytics';

/**
 * Page-level progressive enhancements in one small client island:
 *  - scroll reveal animations (.reveal → .is-visible)
 *  - click tracking via data-track / data-location (+ data-community for WhatsApp links)
 *  - scroll_depth (25/50/75/90), faq_open, page_view   — PRD §44
 * Without JavaScript all content is visible and every link works.
 */
export function ClientEffects({ locale }: { locale: Locale }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js', 'reveal-ready');
    track('page_view', { locale, path: window.location.pathname });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = document.querySelectorAll<HTMLElement>('.reveal');
    let io: IntersectionObserver | null = null;
    if (reduce || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      revealEls.forEach((el) => io?.observe(el));
    }

    // Ambient rain animations ([data-fx]) play only while their scene is on screen (pause off-screen)
    const fxEls = document.querySelectorAll<HTMLElement>('[data-fx]');
    let fxIo: IntersectionObserver | null = null;
    if (!reduce && 'IntersectionObserver' in window) {
      fxIo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) e.target.classList.toggle('is-active', e.isIntersecting);
        },
        { rootMargin: '120px 0px' },
      );
      fxEls.forEach((el) => fxIo?.observe(el));
    }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]');
      if (!el) return;
      track(el.dataset.track as AnalyticsEvent, {
        location: el.dataset.location,
        community: el.dataset.community,
        locale,
      });
    };
    document.addEventListener('click', onClick);

    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement;
      if (d.matches?.('details[data-faq]') && d.open) track('faq_open', { index: Number(d.dataset.faq), locale });
    };
    document.addEventListener('toggle', onToggle, true);

    const marks = [25, 50, 75, 90];
    const fired = new Set<number>();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = root.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
        // The progress bar is a CSS scroll-driven animation: no style write here (it re-styled the whole page on every frame)
        for (const m of marks) {
          if (pct >= m && !fired.has(m)) {
            fired.add(m);
            track('scroll_depth', { percent: m, locale });
          }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io?.disconnect();
      fxIo?.disconnect();
      document.removeEventListener('click', onClick);
      document.removeEventListener('toggle', onToggle, true);
      window.removeEventListener('scroll', onScroll);
    };
  }, [locale]);

  return null;
}
