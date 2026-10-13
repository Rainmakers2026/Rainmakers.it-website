import Image from 'next/image';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { facts } from '@/content/shared';
import { cssVars, SectionHeader } from '../ui';
import { ArrowRight } from '../icons';

/**
 * "Dicono di noi" (PRD §26): every VERIFIED testimonial, then a hook asking Tribe founders for a review.
 * Server-rendered, no client JS: cards slide in from alternating sides with CSS scroll-driven animations.
 * The review CTA opens a pre-filled email to the team (asks for consent to publish).
 */
export function Reviews({ dict }: { dict: Dictionary }) {
  const p = dict.proof;
  const items = p.testimonials.filter((t) => t.status === 'VERIFIED');
  const mail = `mailto:${facts.contactEmail.value}?subject=${encodeURIComponent(p.review.subject)}&body=${encodeURIComponent(p.review.body)}`;
  return (
    <section id={SECTION_IDS.reviews} className="section section--base reviews" aria-labelledby="reviews-title">
      <div className="container">
        <SectionHeader eyebrow={p.eyebrow} title={p.title} intro={p.intro} id="reviews-title" align="center" />
        {items.length ? (
          <ul className="reviews__grid">
            {items.map((r, i) => (
              <li key={r.company} className={`review review--${i % 2 ? 'r' : 'l'}`} style={cssVars({ '--i': i % 3 })}>
                <figure>
                  <span className="review__drop" aria-hidden />
                  <blockquote>
                    <p>{r.quote}</p>
                  </blockquote>
                  <figcaption className="review__who">
                    <Image className="review__logo" src={`/brand/The-Tribe-companies-favicons/${r.logo}`} alt="" width={44} height={44} />
                    <span>
                      <strong>{r.people}</strong>
                      <span>{r.company}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : null}
        {items.length ? <p className="reviews__source">{p.sourceNote}</p> : null}

        <div className="review-cta">
          <span className="review-cta__mark" aria-hidden>
            <span className="review-cta__drop" />
            <svg viewBox="120 100 260 240" width="56" height="52" fill="currentColor" focusable="false">
              <path d="M343.3,127.6c-13.7,0-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8 c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.5-8.1-30.9-19.7c8.7,58.1,57.4,103.2,117.1,106.4 v89.1c0,6.3-4.6,12-10.9,12.6c-7.2,0.7-13.4-5-13.4-12.1v-4.2c0-2.4-1.3-4.5-3.3-5.7l0,0c-4.4-2.5-9.9,0.6-9.9,5.7v3.4 c0,13.2,9.8,24.7,22.9,25.9c15,1.4,27.7-10.4,27.7-25.2v-89.6c60-3,108.8-48.1,117.6-106.4C368.8,119.5,357,127.6,343.3,127.6z" />
            </svg>
          </span>
          <p className="review-cta__hook">{p.review.hook}</p>
          <a className="btn btn--primary review-cta__btn" href={mail} data-track="review_cta_click" data-location="reviews">
            <span>{p.review.cta}</span>
            <ArrowRight aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
