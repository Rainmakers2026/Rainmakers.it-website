import Image from 'next/image';
import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { founderProfile, substack } from '@/content/shared';
import { LinkedIn, Substack, YouTube } from '../icons';
import { YouTubeFacade } from '../YouTubeFacade';

/** Founder & credibility (PRD §6): message and links on the left; embedded video with the circular photo slot below it on the right. */
export function Founder({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.founder;
  const external = dict.ui.a11y.external;
  const links = [
    {
      href: founderProfile.linkedinUrl,
      label: f.linkedinLabel,
      Icon: LinkedIn,
    },
    { href: founderProfile.youtubeUrl, label: f.youtubeLabel, Icon: YouTube },
    { href: substack.url, label: f.substackLabel, Icon: Substack },
  ];
  return (
    <section id={SECTION_IDS.founder} className="section section--raised founder-section" aria-labelledby="founder-title">
      <div className="container founder-section__grid">
        <div>
          <h2 id="founder-title" className="h2 founder-section__title reveal">
            {f.title}
          </h2>
          <p className="lead reveal">{f.text}</p>
          <ul className="founder-links reveal">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener" aria-label={`${label} ${external}`} title={label}>
                  <Icon aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="founder-section__media">
          <figure className="founder-video reveal">
            <YouTubeFacade videoId={founderProfile.videoId} title={f.video.title} play={f.video.play} locale={locale} />
            <figcaption>{f.video.caption}</figcaption>
          </figure>
          <div className="founder-id reveal">
            {/* 1:1 slot: the official photo drops in without layout changes (content/shared.ts → founderProfile.photo) */}
            <div className={`founder-photo ${founderProfile.photo ? '' : 'founder-photo--empty'}`} aria-hidden={founderProfile.photo ? undefined : true}>
              {founderProfile.photo ? <Image src={founderProfile.photo} alt={f.photoAlt} fill sizes="(max-width: 600px) 96px, 128px" /> : null}
            </div>
            <div>
              <p className="founder-id__name">{f.name}</p>
              <p className="founder-id__role">{f.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
