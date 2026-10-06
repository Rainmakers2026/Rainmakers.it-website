import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';

/** 07 — How it works: four steps (PRD §15). Numbers encode a real sequence. */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  const h = dict.how;
  return (
    <section id={SECTION_IDS.how} className="section section--base how" aria-labelledby="how-title">
      <div className="container">
        <SectionHeader eyebrow={h.eyebrow} title={h.title} id="how-title" />
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
      </div>
    </section>
  );
}
