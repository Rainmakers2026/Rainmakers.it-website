import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { Plus } from '../icons';
import { PhText } from '../PhText';
import { SectionHeader } from '../ui';

/** FAQ (PRD §25) — native <details>; answers with placeholders are excluded from FAQPage schema. */
export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <section id={SECTION_IDS.faq} className="section section--raised faq" aria-labelledby="faq-title">
      <div className="container container--narrow">
        <SectionHeader eyebrow={dict.faq.eyebrow} title={dict.faq.title} id="faq-title" />
        <div className="faq__list">
          {dict.faq.items.map((item, i) => (
            <details key={item.q} className="faq__item reveal" data-faq={i}>
              <summary>
                <h3 className="faq__q">{item.q}</h3>
                <Plus aria-hidden className="faq__icon" />
              </summary>
              <PhText as="p" className="faq__a" value={item.a} badge={dict.ui.placeholderBadge} />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
