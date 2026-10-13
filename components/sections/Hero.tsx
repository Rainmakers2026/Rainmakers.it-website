import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { Cta } from '../ui';
import { HERO_ART, RainArt } from '../visuals/RainArt';

/**
 * 01 — Hero: what Rainmakers does, for whom, and the next step (PRD §5.3–5.4). CTAs stay on-site.
 * Illustration: a cloud of connections rains opportunities on entrepreneurs who collect them with
 * umbrellas turned inside out — the Rainmakers mark.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const h = dict.hero;
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <RainArt {...HERO_ART} alt={h.visualLabel} className="hero__art" priority />
      <div className="hero__glow" aria-hidden />
      <div className="container hero__inner">
        <p className="eyebrow hero__eyebrow intro-anim">{h.eyebrow}</p>
        <h1 id="hero-title" className="hero__title intro-anim" style={{ animationDelay: '80ms' }}>
          {h.title} <span className="text-gradient">{h.titleAccent}</span>
        </h1>
        <p className="hero__lead intro-anim" style={{ animationDelay: '180ms' }}>
          {h.lead}
        </p>
        <div className="hero__ctas intro-anim" style={{ animationDelay: '280ms' }}>
          <Cta href={`#${SECTION_IDS.connect}`} track="hero_cta_click" location="hero_primary">
            {dict.ui.cta.start}
          </Cta>
          <Cta href={`#${SECTION_IDS.why}`} variant="secondary" track="hero_cta_click" location="hero_secondary">
            {h.secondaryCta}
          </Cta>
        </div>
      </div>
      <a href={`#${SECTION_IDS.why}`} className="hero__scroll" aria-label={dict.ui.nav.why}>
        <span aria-hidden />
      </a>
    </section>
  );
}
