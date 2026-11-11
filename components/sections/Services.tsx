import Image from 'next/image';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { brand } from '@/content/shared';
import { fillTokens } from '@/lib/i18n';
import { ServiceChart } from '../ServiceChart';
import { SectionHeader, cssVars } from '../ui';
import { CountUp } from '../visuals/CountUp';
import { OrgConnectors } from '../visuals/OrgConnectors';

/**
 * "Cosa fa Rainmakers" (#services, header "Cosa"), one section since 2026-10-27: the title with what Rainmakers does
 * and its figures on the right, then the structure chart without a box or a photo behind it. The umbrella at the
 * root, four branches, their units; each unit opens a popup.
 */
export function Services({ dict }: { dict: Dictionary }) {
  const w = dict.what;
  const s = w.structure;
  // only what the client chart renders, with the data counts ({exits}) filled in
  const structure = {
    examplesLabel: s.examplesLabel,
    close: s.close,
    branches: s.branches.map((b) => ({
      ...b,
      units: b.units.map((u) => ({ ...u, lead: fillTokens(u.lead) })),
    })),
  };
  return (
    <section id={SECTION_IDS.services} className="section section--base org-section" aria-labelledby="org-title">
      <div className="container">
        <div className="what__top">
          <SectionHeader title={w.title} intro={w.lead} id="org-title" />
          <dl className="what__stats">
            {w.stats.map((st, i) => (
              <div key={st.label} className="what__stat reveal" style={cssVars({ '--i': i })}>
                <dt>
                  <CountUp value={st.value} />
                </dt>
                <dd>{st.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="org reveal">
          <figcaption className="org__head">
            <span className="sr-only">{s.label}</span>
            <p className="org__hint" aria-hidden>
              <span className="org__hint-dot" />
              {s.hint}
            </p>
          </figcaption>
          <div className="org__chart">
            {/* lines from the umbrella to each branch and from each branch to its units (measured on the client) */}
            <OrgConnectors />
            <div className="org__root" aria-hidden>
              <span className="org__mark">
                <Image src={brand.files.squareWhite} alt="" width={120} height={120} sizes="120px" />
              </span>
              <span className="org__brand">Rainmakers</span>
              <span className="org__claim">meaningful innovation</span>
            </div>
            <ServiceChart structure={structure} />
          </div>
        </figure>
      </div>
    </section>
  );
}
