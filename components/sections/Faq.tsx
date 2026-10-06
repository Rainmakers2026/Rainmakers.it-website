import type { Dictionary } from '@/content/types';
import { Plus } from '../icons';
import { SectionHeader } from '../ui';

/** FAQ (PRD §32) — native <details>, works without JavaScript; mirrored in FAQPage schema. */
export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <section id="faq" className="section section--base faq" aria-labelledby="faq-title">
      <div className="container container--narrow">
        <SectionHeader eyebrow={dict.faq.eyebrow} title={dict.faq.title} id="faq-title" />
        <div className="faq__list">
          {dict.faq.items.map((item, i) => (
            <details key={item.q} className="faq__item reveal" data-faq={i}>
              <summary>
                <h3 className="faq__q">{item.q}</h3>
                <Plus aria-hidden className="faq__icon" />
              </summary>
              <p className="faq__a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
