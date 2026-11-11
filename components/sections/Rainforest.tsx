import Image from 'next/image';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { facts, rainforest, visuals } from '@/content/shared';
import { Cta } from '../ui';
import { RainforestStats } from '../visuals/RainforestStats';
import { RainforestFx } from '../visuals/RainforestFx';

/**
 * "Come" — Italian Rainforest (PRD §9) and, below it, "Il nostro Giveback" (moved here from "Cosa fa Rainmakers" on
 * 2026-10-26). Background: the rainforest photo (content/shared.ts → visuals.rainforestBackground), served at its
 * own size (1600 px, unoptimized) and anchored to the top of the section so it is never stretched much; it fades into
 * the section colour below.
 */
export function Rainforest({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const r = dict.rainforest;
  const g = dict.what.giveback;
  return (
    <section
      id={SECTION_IDS.rainforest}
      className={`section section--deep rainforest${visuals.rainforestBackground ? ' rainforest--photo' : ''}`}
      aria-labelledby="rainforest-title"
      data-fx
    >
      {visuals.rainforestBackground ? (
        <div className="rainforest__photo" aria-hidden>
          <Image src={visuals.rainforestBackground} alt="" fill unoptimized sizes="100vw" className="rainforest__photo-img" />
        </div>
      ) : null}
      {/* Animated layer: mist and glowing organisations */}
      <RainforestFx rain={false} />
      <div className="rainforest__canopy" aria-hidden />
      <div className="container rainforest__grid">
        <div>
          <h2 id="rainforest-title" className="h2 rainforest__title reveal">
            {r.title}
          </h2>
          <p className="rainforest__tagline reveal">{r.headline}</p>
          <p className="lead rainforest__text reveal">{r.text}</p>
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

      {/* Il nostro Giveback */}
      <div className="container">
        <article className="giveback reveal" aria-labelledby="giveback-title">
          <div>
            <h3 id="giveback-title" className="giveback__title">
              {g.eyebrow}
            </h3>
            <p className="giveback__claim">{g.title}</p>
            <p>{g.text}</p>
          </div>
          <div className="giveback__side">
            <ul className="giveback__tools">
              {g.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
