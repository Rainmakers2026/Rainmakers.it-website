import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { NetworkMap } from '../visuals/NetworkMap';
import { SectionHeader, cssVars } from '../ui';

/**
 * How Rainmakers works (PRD §5.3 step 4, §8): the network around the entrepreneur,
 * the path Connect → Learn → Discover → Collaborate → Grow, and the business units in one line each.
 */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  const h = dict.how;
  return (
    <section id={SECTION_IDS.how} className="section section--raised how" aria-labelledby="how-title">
      <div className="container">
        <SectionHeader eyebrow={h.eyebrow} title={h.title} intro={h.intro} id="how-title" />
        <NetworkMap copy={{ centerLabel: h.centerLabel, hint: h.hint, nodes: h.nodes, mapLabel: h.mapLabel }} />

        <h3 className="h3 how__subtitle reveal">{h.stepsTitle}</h3>
        <ol className="steps steps--5">
          {h.steps.map((s, i) => (
            <li key={s.title} className="step reveal" style={cssVars({ '--i': i })}>
              <span className="step__num" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h4 className="h3">{s.title}</h4>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>

        <h3 className="h3 how__subtitle reveal">{h.servicesTitle}</h3>
        <ul className="services">
          {h.services.map((s, i) => (
            <li key={s.name} className="service reveal" style={cssVars({ '--i': i % 3 })}>
              <strong className="service__name">{s.name}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
