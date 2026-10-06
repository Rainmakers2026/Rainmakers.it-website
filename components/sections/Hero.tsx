import type { Dictionary, Locale } from '@/content/types';
import { rainforest } from '@/content/shared';
import { Cta } from '../ui';
import { HeroNetwork } from '../visuals/HeroNetwork';

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const h = dict.hero;
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <HeroNetwork label={h.visualLabel} />
      <div className="hero__glow" aria-hidden />
      <div className="container hero__inner">
        <p className="eyebrow hero__eyebrow intro-anim" style={{ animationDelay: '0ms' }}>
          {h.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title intro-anim" style={{ animationDelay: '80ms' }}>
          {h.title} <span className="text-gradient">{h.titleAccent}</span>
        </h1>
        <p className="hero__lead intro-anim" style={{ animationDelay: '180ms' }}>
          {h.lead}
        </p>
        <div className="hero__ctas intro-anim" style={{ animationDelay: '280ms' }}>
          <Cta href="#join" track="hero_cta_click" location="hero" intent="join">
            {dict.cta.join}
          </Cta>
          <Cta
            href={rainforest.urlFor(locale)}
            variant="secondary"
            track="rainforest_cta_click"
            location="hero"
            external
            externalLabel={dict.a11y.external}
          >
            {dict.cta.rainforest}
          </Cta>
        </div>
        <div className="hero__connects intro-anim" style={{ animationDelay: '380ms' }}>
          <span className="hero__connects-label">{h.connectsLabel}</span>
          <ul>
            {h.connects.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
      <a href="#why" className="hero__scroll" aria-label={dict.nav.why}>
        <span aria-hidden />
      </a>
    </section>
  );
}
