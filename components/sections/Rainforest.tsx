import Image from 'next/image';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { facts, rainforest } from '@/content/shared';
import { Cta } from '../ui';
import { RainforestStats } from '../visuals/RainforestStats';
import { RainforestFx } from '../visuals/RainforestFx';

/** Italian Rainforest (PRD §9): the linked project for exploring the ecosystem — supports Rainmakers, doesn't replace it. */
export function Rainforest({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const r = dict.rainforest;
  return (
    <section
      id={SECTION_IDS.rainforest}
      className={`section section--deep rainforest ${rainforest.background ? 'rainforest--image' : ''}`}
      aria-labelledby="rainforest-title"
      data-fx
    >
      {/* Decorative background (content/shared.ts → rainforest.background); falls back to the brand gradient */}
      {rainforest.background ? (
        <div className="rainforest__bg" aria-hidden>
          <Image src={rainforest.background} alt="" fill sizes="100vw" quality={70} className="rainforest__bg-img" />
        </div>
      ) : null}
      {/* Animated layer: rain through the canopy, mist, glowing organisations */}
      <RainforestFx />
      <div className="rainforest__canopy" aria-hidden />
      <div className="container rainforest__grid">
        <div>
          <h2 id="rainforest-title" className="h2 rainforest__title reveal">
            {r.title}
          </h2>
          <p className="rainforest__tagline reveal">{r.headline}</p>
          <p className="lead reveal">{r.text}</p>
          <blockquote className="formula reveal">
            <p>{r.formula}</p>
          </blockquote>
          <div className="cta-row reveal">
            <Cta href={rainforest.urlFor(locale)} track="rainforest_cta_click" location="rainforest_section" external externalLabel={dict.ui.a11y.external}>
              {dict.ui.cta.exploreRainforest}
            </Cta>
            <a className="link-arrow" href={`mailto:${facts.contactEmail.value}?subject=${encodeURIComponent('Italian Rainforest — update')}`}>
              {r.contribute}
            </a>
          </div>
        </div>
        <RainforestStats dict={r} locale={locale} />
      </div>
    </section>
  );
}
