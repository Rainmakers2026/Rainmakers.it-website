import { leadFormCopy } from '@/lib/client-copy';
import type { Dictionary, Locale } from '@/content/types';
import { LeadForm } from '../LeadForm';
import { cssVars } from '../ui';

/** 10 — How to join + lead capture (PRD §33–39). */
export function Join({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const j = dict.join;
  return (
    <section id="join" className="section section--deep join" aria-labelledby="join-title">
      <div className="container join__grid">
        <div className="join__intro">
          <p className="eyebrow reveal">
            <span className="eyebrow__index">10</span>
            {j.eyebrow}
          </p>
          <h2 id="join-title" className="h2 reveal">
            {j.title}
          </h2>
          <p className="lead reveal">{j.intro}</p>
          <ol className="join__steps">
            {j.steps.map((s, i) => (
              <li key={s.title} className="reveal" style={cssVars({ '--i': i })}>
                <span className="join__step-num" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h3 className="h3">{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="join__form card card--form reveal">
          <LeadForm dict={leadFormCopy(dict)} locale={locale} />
        </div>
      </div>
    </section>
  );
}
