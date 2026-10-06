import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { SectionHeader, cssVars } from '../ui';
import { NetworkMap } from '../visuals/NetworkMap';

/** 06 — The Rainforest as a network: innovation does not happen in isolation (PRD §13–14). */
export function Network({ dict }: { dict: Dictionary }) {
  const n = dict.network;
  return (
    <section id={SECTION_IDS.network} className="section section--raised network" aria-labelledby="network-title">
      <div className="container">
        <SectionHeader eyebrow={n.eyebrow} title={n.title} intro={n.intro} id="network-title" />
        <NetworkMap copy={{ centerLabel: n.centerLabel, hint: n.hint, nodes: n.nodes, mapLabel: n.mapLabel }} />
        <div className="layers-block">
          <h3 className="h3 layers__title reveal">{n.layersTitle}</h3>
          <ol className="layers">
            {n.layers.map((l, i) => (
              <li key={l.name} className={`layer reveal layer--${i}`} style={cssVars({ '--i': i })}>
                <p className="layer__role">{l.role}</p>
                <h4 className="layer__name">{l.name}</h4>
                <p>{l.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
