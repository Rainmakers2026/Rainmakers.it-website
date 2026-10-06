import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { rainforest } from '@/content/shared';
import { Cta } from '../ui';

/** 10 — Final conversion (PRD §47): primary + secondary CTA, tertiary as text link. */
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
          <Cta href={rainforest.urlFor(locale)} track="rainforest_cta_click" location="final" external externalLabel={dict.ui.a11y.external}>
            {dict.ui.cta.exploreRainforest}
          </Cta>
          <Cta href={`#${SECTION_IDS.community}`} variant="secondary" track="community_cta_click" location="final">
            {dict.ui.cta.community}
          </Cta>
        </div>
        <p className="final__tertiary reveal">
          <a href={`#${SECTION_IDS.connect}`} className="link-arrow link-arrow--down" data-track="contact_cta_click" data-location="final">
            {dict.ui.cta.connect}
          </a>
        </p>
      </div>
    </section>
  );
}
