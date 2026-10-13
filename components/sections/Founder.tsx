import Image from 'next/image';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { founderProfile, substack } from '@/content/shared';
import { Cta } from '../ui';
import { YouTubeFacade } from '../YouTubeFacade';

/** Founder & credibility (PRD §6): circular photo slot, verified facts, embedded video, CTA back to Rainmakers. */
export function Founder({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.founder;
  const external = dict.ui.a11y.external;
  return (
    <section id={SECTION_IDS.founder} className="section section--raised founder-section" aria-labelledby="founder-title">
      <div className="container founder-section__grid">
        <div>
          <div className="founder-id reveal">
            {/* 1:1 slot: the official photo drops in without layout changes (content/shared.ts → founderProfile.photo) */}
            <div className={`founder-photo ${founderProfile.photo ? '' : 'founder-photo--empty'}`} aria-hidden={founderProfile.photo ? undefined : true}>
              {founderProfile.photo ? <Image src={founderProfile.photo} alt={f.photoAlt} fill sizes="(max-width: 600px) 96px, 128px" /> : null}
            </div>
            <div>
              <p className="eyebrow founder-id__eyebrow">{f.eyebrow}</p>
              <p className="founder-id__name">{f.name}</p>
              <p className="founder-id__role">{f.role}</p>
            </div>
          </div>
          <h2 id="founder-title" className="h2 reveal">
            {f.title}
          </h2>
          <p className="lead reveal">{f.text}</p>
          <ul className="founder-facts reveal">
            {f.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="cta-row reveal">
            <Cta href={`#${SECTION_IDS.how}`} variant="secondary" location="founder">
              {f.cta}
            </Cta>
            <a className="link-arrow" href={founderProfile.linkedinUrl} target="_blank" rel="noopener">
              {f.linkedinLabel}
              <span className="sr-only"> {external}</span>
            </a>
            <a className="link-arrow" href={founderProfile.youtubeUrl} target="_blank" rel="noopener">
              {f.youtubeLabel}
              <span className="sr-only"> {external}</span>
            </a>
            <a className="link-arrow" href={substack.url} target="_blank" rel="noopener">
              {f.substackLabel}
              <span className="sr-only"> {external}</span>
            </a>
          </div>
        </div>
        <figure className="founder-video reveal">
          <YouTubeFacade videoId={founderProfile.videoId} title={f.video.title} play={f.video.play} locale={locale} />
          <figcaption>{f.video.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
