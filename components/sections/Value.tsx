import type { Dictionary } from '@/content/types';
import { pillarIcons } from '../icons';
import { SectionHeader, cssVars } from '../ui';

/** 04 — What you get: six pillars (PRD §18). */
export function Value({ dict }: { dict: Dictionary }) {
  const v = dict.value;
  return (
    <section id="value" className="section section--base" aria-labelledby="value-title">
      <div className="container">
        <SectionHeader index="04" eyebrow={v.eyebrow} title={v.title} intro={v.intro} id="value-title" />
        <ul className="pillars">
          {v.pillars.map((p, i) => {
            const Icon = pillarIcons[i % pillarIcons.length];
            return (
              <li key={p.title} className="pillar card reveal" style={cssVars({ '--i': i })}>
                <span className="icon-badge">
                  <Icon aria-hidden />
                </span>
                <h3 className="h3">{p.title}</h3>
                <p>{p.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
