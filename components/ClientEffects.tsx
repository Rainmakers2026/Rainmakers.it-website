'use client';

import { useEffect } from 'react';
import type { Intent, Locale } from '@/content/types';
import { track, type AnalyticsEvent } from '@/lib/analytics';
import { emitIntent } from '@/lib/intent';
import { INTENTS } from '@/lib/options';

/**
 * Page-level progressive enhancements, in one small client island:
 *  - scroll reveal animations (.reveal → .is-visible)
 *  - CTA click tracking via data-track / data-location
 *  - intent preselection via data-intent
 *  - scroll depth (25/50/75/90), FAQ opens, page_view
 * Everything degrades gracefully: without JS all content is visible and links work.
 */
export function ClientEffects({ locale }: { locale: Locale }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js', 'reveal-ready');
    track('page_view', { locale, path: window.location.pathname });

    // Reveal on scroll
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
      revealEls.forEach((el) => io!.observe(el));
    }

    // Click delegation: tracking + intent
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track], [data-intent]');
      if (!el) return;
      const name = el.dataset.track as AnalyticsEvent | undefined;
      if (name) track(name, { location: el.dataset.location, locale });
      const intent = el.dataset.intent as Intent | undefined;
      if (intent && (INTENTS as readonly string[]).includes(intent)) emitIntent(intent);
    };
    document.addEventListener('click', onClick);

    // FAQ opens
    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement;
      if (d.matches?.('details[data-faq]') && d.open) track('faq_open', { index: Number(d.dataset.faq), locale });
    };
    document.addEventListener('toggle', onToggle, true);

    // Scroll depth
    const marks = [25, 50, 75, 90] as const;
    const fired = new Set<number>();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = root.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
        root.style.setProperty('--scroll', String(Math.min(1, pct / 100)));
        for (const m of marks) {
          if (pct >= m && !fired.has(m)) {
            fired.add(m);
            track(`scroll_${m}` as AnalyticsEvent, { locale });
          }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io?.disconnect();
      document.removeEventListener('click', onClick);
      document.removeEventListener('toggle', onToggle, true);
      window.removeEventListener('scroll', onScroll);
    };
  }, [locale]);

  return null;
}
