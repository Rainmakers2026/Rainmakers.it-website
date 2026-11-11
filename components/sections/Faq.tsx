import type { ReactNode } from 'react';
import type { Dictionary } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { isPlaceholder } from '@/content/governance';
import { rainforest } from '@/content/shared';
import { Plus } from '../icons';
import { PhText } from '../PhText';
import { SectionHeader } from '../ui';

function FaqAnswer({ value, dict }: { value: string; dict: Dictionary }) {
  if (isPlaceholder(value)) return <PhText as="p" className="faq__a" value={value} badge={dict.ui.placeholderBadge} />;

  const links = [
    {
      label: 'Italian Rainforest',
      href: rainforest.urlFor(dict.locale),
      external: true,
    },
    { label: 'Track record', href: `#${SECTION_IDS.tribe}` },
    { label: 'Join the Tribe', href: `#${SECTION_IDS.connect}` },
    {
      label: dict.locale === 'it' ? 'Come vuoi iniziare?' : 'How do you want to start?',
      href: `#${SECTION_IDS.connect}`,
    },
  ];

  const parts: ReactNode[] = [];
  let cursor = 0;
  while (cursor < value.length) {
    const match = links
      .map((link) => ({ ...link, index: value.indexOf(link.label, cursor) }))
      .filter((link) => link.index >= 0)
      .sort((a, b) => a.index - b.index || b.label.length - a.label.length)[0];

    if (!match) {
      parts.push(value.slice(cursor));
      break;
    }
    if (match.index > cursor) parts.push(value.slice(cursor, match.index));
    parts.push(
      <a
        key={`${match.index}-${match.label}`}
        href={match.href}
        {...(match.external
          ? {
              target: '_blank',
              rel: 'noopener',
              'data-track': 'rainforest_cta_click',
              'data-location': 'faq',
            }
          : match.href === `#${SECTION_IDS.connect}`
            ? { 'data-track': 'contact_cta_click', 'data-location': 'faq' }
            : {})}
      >
        {match.label}
        {match.external ? <span className="sr-only"> {dict.ui.a11y.external}</span> : null}
      </a>,
    );
    cursor = match.index + match.label.length;
  }

  return <p className="faq__a">{parts}</p>;
}

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
              <FaqAnswer value={item.a} dict={dict} />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
