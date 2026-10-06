import type { Dictionary, Locale } from '@/content/types';
import { rainforest } from '@/content/shared';
import { Cta } from '../ui';

/** 11 — Final CTA (PRD §38, §68): three ways forward, no dead ends. */
export function FinalCta({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="final" aria-labelledby="final-title">
      <div className="final__rings" aria-hidden />
      <div className="container final__inner">
        <h2 id="final-title" className="final__title reveal">
          {dict.final.title}
        </h2>
        <p className="lead reveal">{dict.final.text}</p>
        <div className="final__ctas reveal">
          <Cta href="#join" track="join_cta_click" location="final" intent="join">
            {dict.cta.join}
          </Cta>
          <Cta href={rainforest.urlFor(locale)} variant="secondary" track="rainforest_cta_click" location="final" external externalLabel={dict.a11y.external}>
            {dict.cta.rainforest}
          </Cta>
          <Cta href="#join" variant="ghost" track="contact_cta_click" location="final" intent="contact">
            {dict.cta.contact}
          </Cta>
        </div>
      </div>
    </section>
  );
}
