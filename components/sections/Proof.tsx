import type { Dictionary, Locale } from '@/content/types';
import { tribe } from '@/content/shared';
import { interpolate } from '@/lib/i18n';
import { SectionHeader, cssVars } from '../ui';

/** 08 — Proof / track record, history and meaningful innovation (PRD §23–25). */
export function Proof({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const p = dict.proof;
  return (
    <section id="about" className="section section--raised proof" aria-labelledby="proof-title">
      <div className="container">
        <SectionHeader index="08" eyebrow={p.eyebrow} title={p.title} intro={p.intro} id="proof-title" />

        <dl className="facts">
          {p.facts.map((f, i) => (
            <div key={f.label} className="fact reveal" style={cssVars({ '--i': i })}>
              <dt className="fact__value">{interpolate(f.value, locale)}</dt>
              <dd className="fact__label">{f.label}</dd>
            </div>
          ))}
        </dl>

        <ul className="testimonials">
          {p.testimonials.map((t, i) => (
            <li key={t.company} className="testimonial card reveal" style={cssVars({ '--i': i % 3 })}>
              <figure>
                <dl className="testimonial__context">
                  <div>
                    <dt>{p.needLabel}</dt>
                    <dd>{t.need}</dd>
                  </div>
                  <div>
                    <dt>{p.outcomeLabel}</dt>
                    <dd>{t.outcome}</dd>
                  </div>
                </dl>
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>
                  <strong>{t.people}</strong>
                  <span>{t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="tribe reveal">
          <h3 className="h3">{p.tribeTitle}</h3>
          <div className="marquee">
            <ul className="marquee__track">
              {tribe.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            {/* Duplicate for a seamless loop; hidden from assistive tech */}
            <ul className="marquee__track" aria-hidden>
              {tribe.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <p className="small muted">{p.tribeNote}</p>
        </div>

        <div className="story">
          <article className="story__item reveal">
            <h3 className="h3">{p.historyTitle}</h3>
            <p>{p.historyText}</p>
          </article>
          <article className="story__item story__item--accent reveal">
            <h3 className="h3">{p.meaningfulTitle}</h3>
            <p>{p.meaningfulText}</p>
            <p className="story__legacy">{p.meaningfulLegacy}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
