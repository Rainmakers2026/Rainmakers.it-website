'use client';

import { useEffect, useState } from 'react';
import { ArrowDown } from './icons';

/**
 * Mobile-only persistent primary CTA: "Entra in Rainmakers" → the final conversion section (on-site).
 * Hidden on the hero (which has its own CTAs) and while the conversion section is on screen.
 */
export function StickyCta({ label, href }: { label: string; href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const target = document.getElementById(href.replace('#', ''));
    if (!hero || !target || !('IntersectionObserver' in window)) return;
    let heroVisible = true;
    let targetVisible = false;
    // Hidden on the hero and from the moment the target section enters the screen until the end of the page
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        if (e.target === target) targetVisible = e.isIntersecting || e.boundingClientRect.top < 0;
      }
      setVisible(!heroVisible && !targetVisible);
    });
    io.observe(hero);
    io.observe(target);
    return () => io.disconnect();
  }, [href]);

  return (
    <div className={`sticky-cta ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <a href={href} className="btn btn--primary btn--block" tabIndex={visible ? 0 : -1} data-track="hero_cta_click" data-location="sticky_mobile">
        <span>{label}</span>
        <ArrowDown aria-hidden />
      </a>
    </div>
  );
}
