'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile-only persistent CTA (PRD §44–45). Appears after the hero, hides while the
 * join form is on screen so it never covers the form.
 */
export function StickyCta({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const join = document.getElementById('join');
    if (!hero || !join || !('IntersectionObserver' in window)) return;
    let heroVisible = true;
    let joinVisible = false;
    const update = () => setVisible(!heroVisible && !joinVisible);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        if (e.target === join) joinVisible = e.isIntersecting;
      }
      update();
    });
    io.observe(hero);
    io.observe(join);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`sticky-cta ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <a
        href="#join"
        className="btn btn--primary btn--block"
        tabIndex={visible ? 0 : -1}
        data-track="join_cta_click"
        data-location="sticky_mobile"
        data-intent="join"
      >
        {label}
      </a>
    </div>
  );
}
