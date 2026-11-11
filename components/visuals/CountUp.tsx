'use client';

import { useEffect, useRef } from 'react';

/**
 * Number that counts up from 0 the first time it scrolls into view ("40+", "412", "1.234").
 * The server renders the final value (no-JS, search engines; screen readers get a hidden copy); the animation only
 * rewrites the text node, never the layout (tabular figures + min-width from the final value).
 * Skipped with prefers-reduced-motion or when the number is already on screen at load.
 */
export function CountUp({ value, className, duration = 1600 }: { value: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const match = value.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!el || !match || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [, prefix, digits, suffix] = match;
    const sep = digits.match(/[.,]/)?.[0] ?? '';
    const target = Number(digits.replace(/[.,]/g, ''));
    if (!Number.isFinite(target) || target === 0) return;
    const format = (n: number) => {
      const s = String(n);
      return prefix + (sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s) + suffix;
    };
    // Already visible at load (e.g. after a reload mid-page): keep the final value, no flash
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    el.textContent = format(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = format(Math.round(target * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value, duration]);

  // Assistive tech reads the final value only, never the intermediate frames
  return (
    <>
      <span ref={ref} className={className} style={{ minWidth: `${value.length}ch` }} aria-hidden>
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
