import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { cssVars } from '../ui';

/** 03 — What is Rainmakers: value first, heritage simplified (PRD §10, §41). */
export function About({ dict }: { dict: Dictionary }) {
  const a = dict.about;
  return (
    <section id={SECTION_IDS.about} className="section section--raised about" aria-labelledby="about-title">
      <div className="container about__grid">
        <div>
          <p className="eyebrow reveal">{a.eyebrow}</p>
          <h2 id="about-title" className="h2 reveal">
            {a.title}
          </h2>
          {/* Explicit, quotable entity definition (PRD §23 — GEO) */}
          <p className="about__definition reveal">{a.definition}</p>
          <p className="about__text reveal">{a.text}</p>
          <p className="mission reveal">{a.mission}</p>
          <div className="about__not reveal">
            <p className="about__not-title">{a.notTitle}</p>
            <ul className="about__not-list">
              {a.notList.map((item, i) => (
                <li key={item} style={cssVars({ '--i': i })}>
                  {item}
                </li>
              ))}
            </ul>
            <p className="about__not-outro">{a.notOutro}</p>
          </div>
          <figure className="founder-quote reveal">
            <figcaption>{a.founder.quoteTitle}</figcaption>
            <blockquote>
              <p>{a.founder.quote}</p>
            </blockquote>
            <p className="founder-quote__by">— {a.founder.name}</p>
          </figure>
        </div>
        <aside className="about__side">
        <div className="heritage reveal" aria-labelledby="heritage-title">
          <h3 id="heritage-title" className="heritage__title">
            {a.heritageTitle}
          </h3>
          <dl>
            {a.heritage.map((h) => (
              <div key={h.title} className="heritage__item">
                <dt>{h.title}</dt>
                <dd>{h.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="founder reveal">
          <p className="founder__label">{a.founder.label}</p>
          <figcaption>
            <strong className="founder__name">{a.founder.name}</strong>
            <span className="founder__role">{a.founder.role}</span>
            <span className="founder__motto">{a.founder.motto}</span>
          </figcaption>
          <a className="link-arrow" href="https://www.linkedin.com/in/italianrainmaker" target="_blank" rel="noopener">
            {a.founder.linkedinLabel}
          </a>
        </figure>
        </aside>
      </div>
    </section>
  );
}
