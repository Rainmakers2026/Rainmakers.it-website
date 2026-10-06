import type { Dictionary } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';

/** 09 — Who it is for: entrepreneurs first, secondary audiences acknowledged (PRD §7). */
export function Audience({ dict }: { dict: Dictionary }) {
  const a = dict.audience;
  return (
    <section className="section section--base audience" aria-labelledby="audience-title">
      <div className="container">
        <SectionHeader index="09" eyebrow={a.eyebrow} title={a.title} id="audience-title" />
        <ul className="audience__primary">
          {a.primary.map((p, i) => (
            <li key={p.title} className="card card--outline reveal" style={cssVars({ '--i': i })}>
              <h3 className="h3">{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="audience__secondary reveal">
          <h3 className="audience__secondary-title">{a.secondaryTitle}</h3>
          <ul className="tags tags--lg">
            {a.secondary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="muted">
            {a.secondaryNote}{' '}
          </p>
          <a href="#join" className="link-arrow" data-track="contact_cta_click" data-location="audience" data-intent="contact">
            {dict.cta.contact}
          </a>
        </div>
      </div>
    </section>
  );
}
