import type { CSSProperties } from 'react';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { NewsletterSignup } from '../NewsletterSignup';
import { JoinOptions } from '../JoinOptions';
import { Check } from '../icons';

/** Drops falling into the envelope (deterministic, so server and client markup match). */
const DROPS = [
  { x: 34, d: 0 },
  { x: 58, d: 0.9 },
  { x: 82, d: 1.7 },
  { x: 106, d: 0.4 },
  { x: 130, d: 1.3 },
];

/**
 * Final conversion (PRD §5.3 step 7): "Come vuoi iniziare?" with five cards — company, startup, giveback, work,
 * invest — each opening its popup form, then the newsletter signup (double opt-in, POST /api/newsletter), which
 * replaced the "Connettiti con Rainmakers" contact form on 2026-10-21 (the "Contatti" mini form was removed on
 * 2026-10-26: the five cards are the ways to reach us). Target of the header "Contattaci" and of the hero / sticky CTAs.
 */
export function FinalCta({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.final;
  const n = f.newsletter;
  return (
    <section id={SECTION_IDS.connect} className="final" aria-labelledby="final-title">
      <div className="final__rings" aria-hidden />
      <div className="container final__inner">
        <header className="final__head">
          <h2 id="final-title" className="final__title reveal">
            {f.title}
          </h2>
          <p className="lead final__intro reveal">{f.intro}</p>
        </header>

        <JoinOptions locale={locale} paths={f.paths} />

        <div id="newsletter" className="nl reveal" data-fx>
          <div className="nl__copy">
            <h3 className="nl__title">
              {n.title} <span className="nl__accent">{n.titleAccent}</span>
            </h3>
            <p className="nl__lead">{n.lead}</p>
            <ul className="nl__perks">
              {n.perks.map((perk, i) => (
                <li key={perk} style={{ '--i': i } as CSSProperties}>
                  <span className="nl__tick" aria-hidden>
                    <Check />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          <div className="nl__panel">
            {/* Envelope collecting the rain: one issue a month */}
            <svg className="nl__art" viewBox="0 0 164 132" aria-hidden focusable="false">
              {DROPS.map((drop) => (
                <path
                  key={drop.x}
                  className="nl__drop"
                  style={{ '--d': `${drop.d}s` } as CSSProperties}
                  d={`M${drop.x} 4c-3.2 5-5 8-5 10.5a5 5 0 0 0 10 0c0-2.5-1.8-5.5-5-10.5z`}
                />
              ))}
              <rect className="nl__envelope" x="22" y="58" width="120" height="70" rx="12" />
              <path className="nl__flap" d="M24 64l58 38 58-38" />
            </svg>
            <NewsletterSignup locale={locale} source="final" inline />
            <p className="nl__promise">{n.promise}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
