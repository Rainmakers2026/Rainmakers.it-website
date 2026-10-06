import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { rainforest } from '@/content/shared';
import { Cta } from '../ui';
import { HeroNetwork } from '../visuals/HeroNetwork';

/** 01 — Hero: what it is, who it is for, why it matters, what to do (PRD §8). */
export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const h = dict.hero;
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <HeroNetwork label={h.visualLabel} />
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
          <Cta href={rainforest.urlFor(locale)} track="hero_cta_click" location="hero_primary" external externalLabel={dict.ui.a11y.external}>
            {dict.ui.cta.explore}
          </Cta>
          <Cta href={`#${SECTION_IDS.community}`} variant="secondary" track="hero_cta_click" location="hero_secondary">
            {dict.ui.cta.community}
          </Cta>
        </div>
      </div>
      <a href={`#${SECTION_IDS.why}`} className="hero__scroll" aria-label={dict.ui.nav.why}>
        <span aria-hidden />
      </a>
    </section>
  );
}
