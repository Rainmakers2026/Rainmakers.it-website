import Image from 'next/image';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { visuals } from '@/content/shared';
import { IconEcosystem, IconPin, IconTeam } from '../icons';
import { SectionHeader, cssVars } from '../ui';
import { MindArt } from '../visuals/MindArt';

/** Paese, Persone, Pianeta */
const PILLAR_ICONS = [IconPin, IconTeam, IconEcosystem];

/**
 * "Come" (#why, PRD §5.3 steps 1–2), rebuilt on 2026-10-26: "C'è chi vede il futuro come un problema da evitare…",
 * the purpose right under it (meaningful innovation, "il bene, fatto bene, che paga bene" — moved here from "Cosa fa
 * Rainmakers"), the "Innovation is a state of mind" illustration redrawn in the brand style. Header "Come" lands on the
 * title; "Cosa trovi in Rainmakers" was removed on 2026-10-27 ("Cosa fa Rainmakers" follows); the 3 P close the section
 * since 2026-11-02.
 */
export function Benefits({ dict }: { dict: Dictionary }) {
  const b = dict.benefits;
  const m = dict.what.meaningful;
  return (
    <section id={SECTION_IDS.why} className="section section--base benefits" aria-labelledby="benefits-title">
      <div className="container">
        {/* Title across the full width (fewer lines), then text and illustration side by side (2026-10-27) */}
        <div className="benefits__heading">
          <SectionHeader title={b.title} id="benefits-title" />
        </div>
        <div className="benefits__top">
          <div>
            {/* The definition doubles as the quotable entity description (PRD §17.4, schema.org Organization) */}
            <p className="lead benefits__definition reveal">{b.definition}</p>
            {/* Purpose */}
            <div className="purpose purpose--why reveal">
              <div className="purpose__copy">
                <h3 className="purpose__title">{m.title}</h3>
                <p>{m.text}</p>
              </div>
              <p className="motto reveal">
                {m.motto.map(([before, word], i) => (
                  <span key={i} className="motto__line" style={cssVars({ '--i': i })}>
                    <span className="motto__before">{before}</span> <em className="motto__word">{word}</em>
                  </span>
                ))}
              </p>
            </div>
          </div>
          {/* The original chalk drawing, traced to vectors in the site colours with its rain animated (2026-11-10); an
              animated SVG is served as is (no image optimisation) */}
          {visuals.benefitsImage ? (
            <figure className="benefits__image benefits__image--mind benefits__image--vector reveal">
              <Image
                src={visuals.benefitsImage}
                alt={b.imageAlt}
                width={1213}
                height={604}
                sizes="(max-width: 960px) 100vw, 56vw"
                unoptimized={visuals.benefitsImage.endsWith('.svg')}
              />
            </figure>
          ) : (
            <MindArt label={b.imageAlt} caption={['Innovation is a', 'state of mind']} />
          )}
        </div>
        {/* The 3 P: Paese, Persone, Pianeta (back on 2026-11-02) */}
        <h3 className="h2 benefits__label reveal" id="pillars3-title">
          {m.pillarsLabel}
        </h3>
        <ul className="pillars pillars--3p" aria-labelledby="pillars3-title">
          {m.pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
            return (
              <li key={p.title} className="pillar card reveal" style={cssVars({ '--i': i })}>
                <span className="icon-badge">
                  <Icon aria-hidden />
                </span>
                <h4 className="h3">{p.title}</h4>
                <p>{p.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
