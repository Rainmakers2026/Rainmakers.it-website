import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { accessIcons } from '../icons';
import { SectionHeader, cssVars } from '../ui';

/** 04 — What entrepreneurs can access (PRD §11). */
export function Access({ dict }: { dict: Dictionary }) {
  const a = dict.access;
  return (
    <section id={SECTION_IDS.access} className="section section--base" aria-labelledby="access-title">
      <div className="container">
        <SectionHeader eyebrow={a.eyebrow} title={a.title} intro={a.intro} id="access-title" />
        <ul className="pillars">
          {a.items.map((p, i) => {
            const Icon = accessIcons[i % accessIcons.length];
            return (
              <li key={p.title} className="pillar card reveal" style={cssVars({ '--i': i % 3 })}>
                <span className="icon-badge">
                  <Icon aria-hidden />
                </span>
                <h3 className="h3">{p.title}</h3>
                <p>{p.text}</p>
              </li>
            );
          })}
        </ul>
        <p className="disclaimer reveal">{a.disclaimer}</p>
      </div>
    </section>
  );
}
