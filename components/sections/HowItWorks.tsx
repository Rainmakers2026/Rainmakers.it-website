import type { Dictionary } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';
import { EcosystemModel } from '../visuals/EcosystemModel';

/** 05 — How the ecosystem works: 5 steps + the 3-layer model (PRD §10, §19, §69). */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  const h = dict.how;
  return (
    <section id="ecosystem" className="section section--raised how" aria-labelledby="how-title">
      <div className="container">
        <SectionHeader index="05" eyebrow={h.eyebrow} title={h.title} intro={h.intro} id="how-title" />

        <ol className="steps">
          {h.steps.map((s, i) => (
            <li key={s.title} className="step reveal" style={cssVars({ '--i': i })}>
              <span className="step__num" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="h3">{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="layers-wrap">
          <div>
            <h3 className="h3 layers__title reveal">{h.layersTitle}</h3>
            <ol className="layers">
              {h.layers.map((l, i) => (
                <li key={l.name} className={`layer card reveal layer--${i}`} style={cssVars({ '--i': i })}>
                  <p className="layer__role">{l.role}</p>
                  <h4 className="layer__name">{l.name}</h4>
                  <p>{l.text}</p>
                  <ul className="tags">
                    {l.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
          <EcosystemModel model={h.model} label={h.modelLabel} />
        </div>
      </div>
    </section>
  );
}
