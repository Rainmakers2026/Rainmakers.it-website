import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { fillTokens } from '@/lib/i18n';
import { SectionHeader, cssVars } from '../ui';

/** The Rainmakers model: six business units of an integrated VDO (company overview, May 2025). */
export function Model({ dict }: { dict: Dictionary }) {
  const m = dict.model;
  return (
    <section id={SECTION_IDS.model} className="section section--base model" aria-labelledby="model-title">
      <div className="container">
        <SectionHeader eyebrow={m.eyebrow} title={m.title} intro={m.intro} id="model-title" />
        <ul className="units">
          {m.units.map((u, i) => (
            <li key={u.key} className={`unit reveal unit--${u.key}`} style={cssVars({ '--i': i % 3 })}>
              <p className="unit__tagline">{u.tagline}</p>
              <h3 className="unit__name">{u.name}</h3>
              <p>{u.text}</p>
              {u.stat ? (
                <p className="unit__stat">
                  <strong>{fillTokens(u.stat.value)}</strong> <span>{fillTokens(u.stat.label)}</span>
                </p>
              ) : null}
              {u.items ? (
                <ul className="unit__items">
                  {u.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              ) : null}
              <p className="unit__foryou">
                <span>{m.forYouLabel}</span> {u.forYou}
              </p>
              {u.link ? (
                <a className="link-arrow link-arrow--down unit__link" href={`#${SECTION_IDS[u.link.target]}`}>
                  {u.link.label}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
