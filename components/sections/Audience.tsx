import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';

/** 08 — Who it is for: the founder first, secondary personas acknowledged (PRD §4–5). */
export function Audience({ dict }: { dict: Dictionary }) {
  const a = dict.audience;
  return (
    <section id={SECTION_IDS.audience} className="section section--raised audience" aria-labelledby="audience-title">
      <div className="container audience__grid">
        <div>
          <SectionHeader eyebrow={a.eyebrow} title={a.title} intro={a.intro} id="audience-title" />
        </div>
        <div className="audience__lists">
          <div className="audience__primary reveal">
            <h3 className="audience__label">{a.primaryTitle}</h3>
            <ul>
              {a.primary.map((p, i) => (
                <li key={p} style={cssVars({ '--i': i })}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="audience__secondary reveal">
            <h3 className="audience__label">{a.secondaryTitle}</h3>
            <dl>
              {a.secondary.map((s) => (
                <div key={s.title}>
                  <dt>{s.title}</dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
