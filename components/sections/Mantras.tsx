import type { Dictionary } from '@/content/types';
import { IconQuote } from '../icons';
import { cssVars } from '../ui';

/**
 * "Le regole del rainmaking": the three maxims supplied on 2026-10-19, one at a time in large type. Pure CSS: each
 * quote owns a third of a 18 s cycle (rise in, hold, fade out) with a progress line; paused off-screen (data-fx) and
 * on hover; with reduced motion all three are listed. All quotes are always in the DOM, so they are read and indexed.
 */
export function Mantras({ dict }: { dict: Dictionary }) {
  const m = dict.mantras;
  return (
    <section className="mantras" aria-labelledby="mantras-title" data-fx>
      <div className="container mantras__inner">
        <h2 id="mantras-title" className="mantras__label">
          <IconQuote aria-hidden />
          {m.label}
        </h2>
        <ul className="mantras__list" style={cssVars({ '--n': m.items.length })}>
          {m.items.map((q, i) => (
            <li key={q} className="mantra" style={cssVars({ '--i': i })}>
              <blockquote>
                <p>{q}</p>
              </blockquote>
            </li>
          ))}
        </ul>
        <div className="mantras__dots" aria-hidden>
          {m.items.map((q, i) => (
            <span key={q} style={cssVars({ '--i': i })} />
          ))}
        </div>
      </div>
    </section>
  );
}
