'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import type { ProofCopy } from '@/content/types';
import { ArrowRight } from './icons';

export interface ReviewSlide {
  quote: string;
  people: string;
  company: string;
  logo: { src: string; width: number; height: number; box: { width: number; height: number } } | null;
}

const INTERVAL = 7000;

/**
 * "Dicono di noi" carousel: translucent glass cards in a 3D coverflow — the active review in front, its neighbours
 * tilted and blurred behind — with the company logo under each quote. Autoplay (paused on hover, focus, off-screen,
 * by the pause button or with reduced motion), prev/next, dots with a progress fill, arrow keys and swipe.
 * Server-rendered with the first review in front; without JS the CSS shows every review as a list.
 */
export function ReviewsCarousel({ items, labels }: { items: ReviewSlide[]; labels: ProofCopy['carousel'] }) {
  const n = items.length;
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const swipe = useRef<number | null>(null);

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);

  useEffect(() => {
    setReady(true);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = ready && !paused && !hold && onScreen && !reduced && n > 1;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => go(active + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, active, go]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(active - 1);
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipe.current == null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
  };

  /** Signed distance from the active slide, wrapped so the ring is continuous. */
  const offset = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div
      ref={root}
      className={`rv${ready ? ' is-ready' : ''}${running ? ' is-running' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.label}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
      }}
      onKeyDown={onKey}
    >
      <ul className="rv__stage" aria-live={running ? 'off' : 'polite'} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {items.map((r, i) => {
          const d = offset(i);
          const front = d === 0;
          return (
            <li
              key={r.company}
              className={`rv__slide${front ? ' is-active' : ''}${Math.abs(d) > 2 ? ' is-far' : ''}`}
              style={{ '--d': d, '--ad': Math.abs(d) } as CSSProperties}
              aria-roledescription="slide"
              aria-label={labels.goTo.replace('{n}', String(i + 1)).replace('{total}', String(n))}
              aria-hidden={ready && !front ? true : undefined}
              inert={ready && !front ? true : undefined}
              onClick={front ? undefined : () => go(i)}
            >
              <figure className="rv__card">
                <span className="rv__mark" aria-hidden>
                  “
                </span>
                <blockquote>
                  <p>{r.quote}</p>
                </blockquote>
                <figcaption className="rv__who">
                  {r.logo ? (
                    <span className="rv__logo">
                      <Image
                        src={r.logo.src}
                        alt={r.company}
                        width={r.logo.width}
                        height={r.logo.height}
                        style={{ width: r.logo.box.width, height: r.logo.box.height }}
                        sizes={`${r.logo.box.width}px`}
                      />
                    </span>
                  ) : null}
                  <strong>{r.people}</strong>
                  <span>{r.company}</span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      {n > 1 ? (
        <div className="rv__controls">
          <button type="button" className="rv__arrow rv__arrow--prev" onClick={() => go(active - 1)} aria-label={labels.prev}>
            <ArrowRight aria-hidden />
          </button>
          <ol className="rv__dots">
            {items.map((r, i) => (
              <li key={r.company}>
                <button
                  type="button"
                  className={`rv__dot${i === active ? ' is-active' : ''}`}
                  style={{ '--t': `${INTERVAL}ms` } as CSSProperties}
                  aria-label={labels.goTo.replace('{n}', String(i + 1)).replace('{total}', String(n))}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => go(i)}
                >
                  <span key={i === active ? `on-${active}` : 'off'} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="rv__arrow" onClick={() => go(active + 1)} aria-label={labels.next}>
            <ArrowRight aria-hidden />
          </button>
          {!reduced ? (
            <button type="button" className="rv__toggle" onClick={() => setPaused((p) => !p)} aria-label={paused ? labels.play : labels.pause} aria-pressed={paused}>
              <span className={paused ? 'rv__play' : 'rv__pause'} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
