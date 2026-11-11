import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { reviewLink } from '@/content/shared';
import { isPlaceholder } from '@/content/governance';
import { logoBox, whiteLogo } from '@/content/data/logos';
import { SectionHeader, cssVars } from '../ui';
import { ArrowRight } from '../icons';
import { ReviewForm } from '../ReviewForm';
import { ReviewsCarousel, type ReviewSlide } from '../ReviewsCarousel';

/**
 * "Dicono di noi" (PRD §26), redesigned on 2026-10-19 to stand apart from the Tribe / Innovation Advisory cards:
 * every VERIFIED testimonial as a translucent glass card in a 3D carousel, the company logo under the quote, over a
 * background of slow rain ripples (CSS, paused off-screen via data-fx). The button opens the review form popover
 * (POST /api/review → Supabase + email to info@rainmakers.it).
 */
export function Reviews({ dict }: { dict: Dictionary }) {
  const p = dict.proof;
  const pendingLink = isPlaceholder(reviewLink.value);
  const items: ReviewSlide[] = p.testimonials
    .filter((t) => t.status === 'VERIFIED')
    .map((t) => {
      const logo = whiteLogo(t.logo);
      return {
        quote: t.quote,
        people: t.people,
        company: t.company,
        logo: logo
          ? {
              src: logo.src,
              width: logo.width,
              height: logo.height,
              box: logoBox(logo, 6200, 190, 58),
            }
          : null,
      };
    });
  return (
    <section id={SECTION_IDS.reviews} className="section reviews reviews--glass" aria-labelledby="reviews-title" data-fx>
      <div className="reviews__ripples" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={cssVars({ '--i': i })} />
        ))}
      </div>
      <div className="container">
        <SectionHeader title={p.title} id="reviews-title" align="center" />
        {items.length ? <ReviewsCarousel items={items} labels={p.carousel} /> : null}
        <div className="reviews__cta reveal">
          <button type="button" className="btn btn--secondary review-cta__btn" popoverTarget="review-pop" data-track="review_cta_click" data-location="reviews">
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
