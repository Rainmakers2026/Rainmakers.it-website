import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { leadFormCopy } from '@/lib/client-copy';
import { LeadForm } from '../LeadForm';

/** Lead capture: "Connect with Rainmakers" (PRD §18–21, tertiary CTA). */
export function Connect({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const c = dict.connect;
  return (
    <section id={SECTION_IDS.connect} className="section section--base connect" aria-labelledby="connect-title">
      <div className="container connect__grid">
        <div className="connect__intro">
          <p className="eyebrow reveal">{c.eyebrow}</p>
          <h2 id="connect-title" className="h2 reveal">
            {c.title}
          </h2>
          <p className="lead reveal">{c.intro}</p>
        </div>
        <div className="connect__form card card--form reveal">
          <LeadForm dict={leadFormCopy(dict)} locale={locale} />
        </div>
      </div>
    </section>
  );
}
