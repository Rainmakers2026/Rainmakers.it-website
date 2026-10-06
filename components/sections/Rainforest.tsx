import type { Dictionary, Locale } from '@/content/types';
import { contacts, rainforest } from '@/content/shared';
import { Cta, cssVars } from '../ui';
import { RainforestStats } from '../visuals/RainforestStats';

/** 06 — Italian Rainforest: the second discovery point (PRD §11, §20). */
export function Rainforest({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const r = dict.rainforest;
  return (
    <section className="section section--deep rainforest" aria-labelledby="rainforest-title">
      <div className="rainforest__canopy" aria-hidden />
      <div className="container rainforest__grid">
        <div>
          <p className="eyebrow reveal">
            <span className="eyebrow__index">06</span>
            {r.eyebrow}
          </p>
          <h2 id="rainforest-title" className="h2 reveal">
            {r.title}
          </h2>
          <p className="lead reveal">{r.text}</p>
          <blockquote className="formula reveal">
            <p>{r.formula}</p>
          </blockquote>
          <ul className="rf-features">
            {r.features.map((f, i) => (
              <li key={f.title} className="reveal" style={cssVars({ '--i': i })}>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <div className="cta-row reveal">
            <Cta
              href={rainforest.urlFor(locale)}
              track="rainforest_cta_click"
              location="rainforest_section"
              external
              externalLabel={dict.a11y.external}
            >
              {dict.cta.rainforest}
            </Cta>
            <a
              className="link-arrow"
              href={`mailto:${contacts.rainforest}?subject=${encodeURIComponent('Italian Rainforest — update')}`}
            >
              {r.secondaryCta}
            </a>
          </div>
        </div>
        <RainforestStats dict={r} locale={locale} />
      </div>
    </section>
  );
}
