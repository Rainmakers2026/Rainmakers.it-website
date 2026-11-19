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
 * by the pause button or with reduced motion), prev/next, dots with a progress fill, arrow keys, swipe and click-and-drag
 * with the mouse (2026-11-18: the cards follow the pointer, release moves by as many reviews as were dragged), and the
 * two-finger horizontal swipe of a trackpad (2026-11-19: one review per gesture; vertical scrolling is left to the page).
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
  /** Drag in progress: start x, step width in px, whether it moved past the click threshold. */
  const swipe = useRef<{ id: number; x: number; step: number; moved: boolean } | null>(null);
  /** Live drag offset in slides (negative = towards the next review); null when not dragging. */
  const [drag, setDrag] = useState<number | null>(null);
  /** Swallows the click that follows a drag, so releasing over a side card does not jump to it. */
  const dragged = useRef(false);

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

  // Trackpad two-finger swipe (horizontal wheel events). Native listener: React's wheel handler is passive and could
  // not stop the browser's own "swipe = history back/forward". The gesture (and its inertia) moves one review; the
  // next one needs the fingers to rest for a moment.
  useEffect(() => {
    const el = root.current;
    if (!el || n < 2) return;
    let acc = 0;
    let locked = false;
    let quiet: number | undefined;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      // vertical scrolling and pinch-zoom (ctrlKey) stay with the page
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || e.ctrlKey) return;
      e.preventDefault();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        locked = false;
        acc = 0;
      }, 220);
      if (locked) return;
      acc += dx;
      if (Math.abs(acc) < 50) return;
      locked = true;
      const dir = acc > 0 ? 1 : -1; // fingers moving left (positive deltaX) → next review
      acc = 0;
      setActive((a) => (((a + dir) % n) + n) % n);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(quiet);
    };
  }, [n]);

  const running = ready && !paused && !hold && drag == null && onScreen && !reduced && n > 1;
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
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    // a second finger on a touch screen does not restart the drag: the first one keeps leading
    if (n < 2 || swipe.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const slide = e.currentTarget.querySelector<HTMLElement>('.rv__slide.is-active');
    // a slide sits 74% of its width from its neighbour, 88% on phones (see .rv__slide in globals.css)
    const pitch = window.matchMedia('(max-width: 640px)').matches ? 0.88 : 0.74;
    swipe.current = { id: e.pointerId, x: e.clientX, step: Math.max(120, (slide?.offsetWidth ?? 600) * pitch), moved: false };
    dragged.current = false;
  };
  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const s = swipe.current;
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x;
    if (!s.moved) {
      if (Math.abs(dx) < 6) return;
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    setDrag(Math.max(-(n - 1), Math.min(n - 1, dx / s.step)));
  };
  const onPointerEnd = (e: PointerEvent<HTMLUListElement>) => {
    const s = swipe.current;
    if (s && e.pointerId !== s.id) return;
    swipe.current = null;
    setDrag(null);
    if (!s?.moved) return;
    dragged.current = true;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const dx = e.clientX - s.x;
    if (e.type === 'pointercancel' || Math.abs(dx) <= 40) return;
    // at least one review, then as many as were dragged across
    const steps = Math.max(1, Math.round(Math.abs(dx) / s.step));
    go(active + (dx < 0 ? steps : -steps));
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
      className={`rv${ready ? ' is-ready' : ''}${running ? ' is-running' : ''}${drag != null ? ' is-dragging' : ''}`}
      style={{ '--drag': drag ?? 0 } as CSSProperties}
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
      <ul
        className="rv__stage"
        aria-live={running ? 'off' : 'polite'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (!dragged.current) return;
          dragged.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
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
