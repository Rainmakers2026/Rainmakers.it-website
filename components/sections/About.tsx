import type { Dictionary } from '@/content/types';
import { cssVars } from '../ui';

/** 03 — What is Rainmakers (defined after the problem, PRD §17). */
export function About({ dict }: { dict: Dictionary }) {
  const a = dict.about;
  return (
    <section className="section section--raised about" aria-labelledby="about-title">
      <div className="container about__inner">
        <p className="eyebrow reveal">
          <span className="eyebrow__index">03</span>
          {a.eyebrow}
        </p>
        <h2 id="about-title" className="h2 about__title reveal">
          {a.title}
        </h2>
        <p className="about__text reveal">{a.text}</p>
        {/* Explicit, quotable definition for search & generative engines (PRD §30) */}
        <p className="about__definition reveal">
          <strong>{a.definition}</strong>
        </p>
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
      </div>
    </section>
  );
}
