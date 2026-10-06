import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { cssVars } from '../ui';

/** 02 — The problem: entrepreneurs need access, not only money, consulting or information (PRD §9). */
export function Why({ dict }: { dict: Dictionary }) {
  const w = dict.why;
  return (
    <section id={SECTION_IDS.why} className="section section--base why" aria-labelledby="why-title">
      <div className="container why__grid">
        <header className="why__head reveal">
          <p className="eyebrow">{w.eyebrow}</p>
          <h2 id="why-title" className="h2">
            {w.title}
          </h2>
          <p className="lead">{w.intro}</p>
        </header>
        <div className="why__shift reveal" aria-label={`${w.notOnlyLabel} ${w.notOnly.join(', ')}. ${w.accessLabel} ${w.access.join(', ')}.`}>
          <div className="why__from" aria-hidden>
            <span className="why__label">{w.notOnlyLabel}</span>
            <ul>
              {w.notOnly.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="why__arrow" aria-hidden />
          <div className="why__to" aria-hidden>
            <span className="why__label">{w.accessLabel}</span>
            <ul>
              {w.access.map((x, i) => (
                <li key={x} style={cssVars({ '--i': i })}>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="container">
        <blockquote className="statement reveal">
          <p>{w.statement}</p>
        </blockquote>
      </div>
    </section>
  );
}
