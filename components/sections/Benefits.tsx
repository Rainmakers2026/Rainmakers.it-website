import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { accessIcons } from '../icons';
import { SectionHeader, cssVars } from '../ui';
import { RainArt, SHELTER_ART } from '../visuals/RainArt';

/**
 * Why Rainmakers: what an entrepreneur gets, and who it is for (PRD §5.3 steps 1–2).
 * Illustration: alone under an open umbrella you shelter from the rain; turned inside out
 * (the Rainmakers mark) and together, the umbrellas collect it.
 */
export function Benefits({ dict }: { dict: Dictionary }) {
  const b = dict.benefits;
  return (
    <section id={SECTION_IDS.why} className="section section--base benefits" aria-labelledby="benefits-title">
      <div className="container">
        <div className="benefits__top">
          {/* The definition doubles as the quotable entity description (PRD §17.4, schema.org Organization) */}
          <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.definition} id="benefits-title" />
          <RainArt {...SHELTER_ART} alt={b.artAlt} className="benefits__art reveal" />
        </div>
        <ul className="pillars pillars--4">
          {b.items.map((p, i) => {
            const Icon = accessIcons[i % accessIcons.length];
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
        <p className="benefits__audience reveal">
          <strong>{b.audienceLabel}:</strong> {b.audience}
        </p>
      </div>
    </section>
  );
}
