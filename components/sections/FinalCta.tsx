import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { leadFormCopy } from '@/lib/client-copy';
import { LeadForm } from '../LeadForm';
import { NewsletterSignup } from '../NewsletterSignup';
import { ArrowDown, ArrowRight } from '../icons';

/**
 * Final conversion (PRD §5.3 step 7): three ways into Rainmakers, then the contact form.
 * Target of the hero and sticky "Entra in Rainmakers" CTAs.
 */
export function FinalCta({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.final;
  const c = dict.connect;
  const paths = [
    { key: 'community', ...f.paths.community, href: `#${SECTION_IDS.community}`, track: 'community_cta_click', icon: ArrowDown },
    { key: 'join', ...f.paths.join, href: `/${locale}/join`, track: 'community_cta_click', icon: ArrowRight },
    { key: 'contact', ...f.paths.contact, href: '#connect-form', track: 'contact_cta_click', icon: ArrowDown },
  ];
  return (
    <section id={SECTION_IDS.connect} className="final" aria-labelledby="final-title">
      <div className="final__rings" aria-hidden />
      <div className="container final__inner">
        <p className="eyebrow reveal">{f.eyebrow}</p>
        <h2 id="final-title" className="final__title reveal">
          {f.title}
        </h2>
        <p className="lead reveal">{f.text}</p>

        <ul className="paths">
          {paths.map((p) => (
            <li key={p.key} className="reveal">
              <a className={`path-card ${p.key === 'contact' ? 'path-card--primary' : ''}`} href={p.href} data-track={p.track} data-location={`final_${p.key}`}>
                <strong className="path-card__title">{p.title}</strong>
                <span className="path-card__text">{p.text}</span>
                <span className="path-card__cta">
                  {p.cta} <p.icon aria-hidden className="inline-icon" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div id="connect-form" className="final__form">
          <div className="final__form-intro">
            <h3 className="h2">{c.title}</h3>
            <p className="lead">{c.intro}</p>
            <NewsletterSignup locale={locale} className="final__newsletter" source="final" />
          </div>
          <div className="card card--form">
            <LeadForm dict={leadFormCopy(dict)} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
