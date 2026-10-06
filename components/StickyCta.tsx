'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from './icons';

/**
 * Mobile-only persistent primary CTA (PRD §6, §37): "Explore the ecosystem".
 * Hidden on the hero (which has its own CTAs) and while the contact form is on screen.
 */
export function StickyCta({ label, href, external }: { label: string; href: string; external: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const form = document.getElementById('connect');
    if (!hero || !form || !('IntersectionObserver' in window)) return;
    let heroVisible = true;
    let formVisible = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        if (e.target === form) formVisible = e.isIntersecting;
      }
      setVisible(!heroVisible && !formVisible);
    });
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`sticky-cta ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="btn btn--primary btn--block"
        tabIndex={visible ? 0 : -1}
        data-track="rainforest_cta_click"
        data-location="sticky_mobile"
      >
        <span>{label}</span>
        <ArrowUpRight aria-hidden />
        <span className="sr-only"> {external}</span>
      </a>
    </div>
  );
}
