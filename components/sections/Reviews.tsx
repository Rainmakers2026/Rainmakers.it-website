import Image from 'next/image';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { reviewLink } from '@/content/shared';
import { isPlaceholder } from '@/content/governance';
import { cssVars, SectionHeader } from '../ui';
import { ArrowRight } from '../icons';
import { ReviewForm } from '../ReviewForm';

/**
 * "Dicono di noi" (PRD §26): every VERIFIED testimonial, then a hook asking Tribe founders for a review.
 * Server-rendered, no client JS: cards slide in with CSS scroll-driven animations, then float, drip and
 * catch a passing light (paused off-screen via data-fx). The CTA opens a native popover with the review form
 * (POST /api/review → Supabase + email to info@rainmakers.it) and the review-platform link (placeholder until
 * provided: content/shared.ts → reviewLink).
 */
export function Reviews({ dict }: { dict: Dictionary }) {
  const p = dict.proof;
  const items = p.testimonials.filter((t) => t.status === 'VERIFIED');
  const pendingLink = isPlaceholder(reviewLink.value);
  return (
    <section id={SECTION_IDS.reviews} className="section section--base reviews" aria-labelledby="reviews-title" data-fx>
      <div className="container">
        <SectionHeader eyebrow={p.eyebrow} title={p.title} intro={p.intro} id="reviews-title" align="center" />
        {items.length ? (
          <ul className="reviews__grid">
            {items.map((r, i) => (
              <li key={r.company} className={`review review--${i % 2 ? 'r' : 'l'}`} style={cssVars({ '--i': i % 3, '--n': i })}>
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
          <button type="button" className="btn btn--primary review-cta__btn" popoverTarget="review-pop" data-track="review_cta_click" data-location="reviews">
            <span>{p.review.cta}</span>
            <ArrowRight aria-hidden />
          </button>
        </div>

        <div id="review-pop" popover="auto" className="review-pop" role="dialog" aria-labelledby="review-pop-title">
          <button type="button" className="review-pop__close" popoverTarget="review-pop" popoverTargetAction="hide" aria-label={p.review.close}>
            <span aria-hidden>×</span>
          </button>
          <span className="review-pop__drop" aria-hidden />
          <h3 id="review-pop-title" className="review-pop__title">{p.review.popTitle}</h3>
          <p className="review-pop__text">{p.review.popText}</p>
          <ReviewForm copy={p.review.form} locale={dict.locale} external={dict.ui.a11y.external} platformUrl={pendingLink ? null : reviewLink.value} />
        </div>
      </div>
    </section>
  );
}
