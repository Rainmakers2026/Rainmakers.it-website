import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { facts, rainforest } from '@/content/shared';
import { Cta, cssVars } from '../ui';
import { RainforestStats } from '../visuals/RainforestStats';

/** 05 — Italian Rainforest: the ecosystem intelligence layer (PRD §12–13). */
export function Rainforest({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const r = dict.rainforest;
  return (
    <section id={SECTION_IDS.rainforest} className="section section--deep rainforest" aria-labelledby="rainforest-title">
      <div className="rainforest__canopy" aria-hidden />
      <div className="container rainforest__grid">
        <div>
          <p className="eyebrow reveal">{r.eyebrow}</p>
          <h2 id="rainforest-title" className="h2 reveal">
            {r.title}
          </h2>
          <p className="rainforest__tagline reveal">{r.tagline}</p>
          <p className="lead reveal">{r.text}</p>
          <div className="rf-explore reveal">
            <p className="rf-explore__label">{r.exploreLabel}</p>
            <ul className="tags">
              {r.explore.map((x, i) => (
                <li key={x} style={cssVars({ '--i': i })}>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <blockquote className="formula reveal">
            <p>{r.formula}</p>
          </blockquote>
          <div className="cta-row reveal">
            <Cta href={rainforest.urlFor(locale)} track="rainforest_cta_click" location="rainforest_section" external externalLabel={dict.ui.a11y.external}>
              {dict.ui.cta.exploreRainforest}
            </Cta>
            <a className="link-arrow" href={`mailto:${facts.rainforestEmail.value}?subject=${encodeURIComponent('Italian Rainforest — update')}`}>
              {r.contribute}
            </a>
          </div>
        </div>
        <RainforestStats dict={r} locale={locale} />
      </div>
    </section>
  );
}
