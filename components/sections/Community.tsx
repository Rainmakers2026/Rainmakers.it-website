import type { Dictionary } from '@/content/types';
import { community } from '@/content/shared';
import { Cta, SectionHeader, cssVars } from '../ui';
import { IconLock, WhatsApp } from '../icons';

/** 07 — Communities: the relational conversion layer (PRD §12, §21, §22). */
export function Community({ dict }: { dict: Dictionary }) {
  const c = dict.community;
  return (
    <section id="communities" className="section section--base community" aria-labelledby="community-title">
      <div className="container">
        <SectionHeader index="07" eyebrow={c.eyebrow} title={c.title} intro={c.text} id="community-title" />

        <div className="community__grid">
          <ul className="community__bullets">
            {c.bullets.map((b, i) => (
              <li key={b.title} className="card reveal" style={cssVars({ '--i': i })}>
                <h3 className="h3">{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ul>

          <aside className="community__aside reveal">
            <figure className="quote">
              <blockquote>
                <p>{c.quote}</p>
              </blockquote>
              <figcaption>{c.quoteSource}</figcaption>
            </figure>
            <div className="community__exclusive">
              <h3 className="h3">{c.exclusiveTitle}</h3>
              <p>{c.exclusiveText}</p>
            </div>
            <p className="community__access">
              <IconLock aria-hidden />
              <span>
                {c.accessNote}
                {community.limitedMembership ? ` ${c.limitedNote}` : ''}
              </span>
            </p>
            <Cta href="#join" track="community_cta_click" location="community_section" intent="community" className="btn--block">
              {dict.cta.community}
            </Cta>
            <p className="community__public">
              {c.publicCommunityText}{' '}
              <a
                href={community.publicWhatsappUrl}
                target="_blank"
                rel="noopener"
                data-track="whatsapp_click"
                data-location="community_section"
              >
                <WhatsApp aria-hidden className="inline-icon" />
                {c.publicCommunityCta}
                <span className="sr-only"> {dict.a11y.external}</span>
              </a>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
