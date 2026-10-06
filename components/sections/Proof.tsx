import type { Dictionary } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';

/**
 * Social proof (PRD §26): renders ONLY testimonials marked VERIFIED (still valid and authorised).
 * Returns nothing while none are verified — no fake or unconfirmed quotes reach the page.
 */
export function Proof({ dict }: { dict: Dictionary }) {
  const p = dict.proof;
  const items = p.testimonials.filter((t) => t.status === 'VERIFIED');
  if (!items.length) return null;
  return (
    <section className="section section--base proof" aria-labelledby="proof-title">
      <div className="container">
        <SectionHeader eyebrow={p.eyebrow} title={p.title} id="proof-title" />
        <ul className="testimonials">
          {items.map((t, i) => (
            <li key={t.company} className="testimonial card reveal" style={cssVars({ '--i': i % 3 })}>
              <figure>
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>
                  <strong>{t.people}</strong>
                  <span>{t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
