import Image from 'next/image';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { visuals } from '@/content/shared';
import { Cta } from '../ui';
import { HERO_ART, RainArt } from '../visuals/RainArt';
import { Drizzle } from '../visuals/Drizzle';

/**
 * 01 — Hero: what Rainmakers does and the next step (PRD §5.3–5.4). CTAs stay on-site.
 * Visual: the rainforest landscape (content/shared.ts → visuals.heroBackground, Figma review 2026-10-15) on the
 * right of the copy on desktop, above it on phones so the title never sits on the image; without it, the
 * illustration of a cloud raining opportunities on entrepreneurs with umbrellas turned inside out.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const h = dict.hero;
  return (
    <section id="top" className={`hero${visuals.heroBackground ? ' hero--photo' : ''}`} aria-labelledby="hero-title">
      {visuals.heroBackground ? (
        <div className="hero__photo" aria-hidden>
          {/* served as is: re-encoding would soften the photo further */}
          <Image src={visuals.heroBackground} alt="" fill priority unoptimized sizes="(max-width: 900px) 100vw, 60vw" className="hero__photo-img" />
        </div>
      ) : (
        <RainArt {...HERO_ART} alt={h.visualLabel} className="hero__art" priority />
      )}
      <div className="hero__glow" aria-hidden />
      {/* light drizzle over the photo, a little denser than the page-wide one (components/visuals/Drizzle.tsx) */}
      <Drizzle variant="hero" />
      <div className="container hero__inner">
        {/* The purpose is the title (2026-10-27): the header "Perché" lands on the claim above it */}
        <p id={SECTION_IDS.purpose} className="hero__eyebrow intro-anim" style={{ animationDelay: '40ms' }}>
          {h.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title intro-anim" style={{ animationDelay: '80ms' }}>
          {h.title} <span className="text-gradient">{h.titleAccent}</span> {h.titleTail}
        </h1>
        <p className="hero__lead intro-anim" style={{ animationDelay: '180ms' }}>
          {h.lead}
        </p>
        <div className="hero__ctas intro-anim" style={{ animationDelay: '280ms' }}>
          <Cta href={`#${SECTION_IDS.connect}`} track="hero_cta_click" location="hero_primary">
            {h.primaryCta}
          </Cta>
        </div>
      </div>
      <a href={`#${SECTION_IDS.why}`} className="hero__scroll" aria-label={h.scrollLabel}>
        <span aria-hidden />
      </a>
    </section>
  );
}
