import type { Dictionary } from '@/content/types';
import { challengeIcons } from '../icons';
import { cssVars } from '../ui';

/** 02 — The entrepreneur's challenge. Sticky title + list that scrolls past it (ALONE). */
export function Challenge({ dict }: { dict: Dictionary }) {
  const c = dict.challenge;
  return (
    <section id="why" className="section section--base challenge" aria-labelledby="challenge-title">
      <div className="container challenge__grid">
        <header className="challenge__sticky reveal">
          <p className="eyebrow">
            <span className="eyebrow__index">02</span>
            {c.eyebrow}
          </p>
          <h2 id="challenge-title" className="h2">
            {c.title}
          </h2>
          <p className="lead">{c.intro}</p>
        </header>
        <div>
          <ol className="challenge__list">
            {c.items.map((item, i) => {
              const Icon = challengeIcons[i % challengeIcons.length];
              return (
                <li key={item.title} className="challenge__item reveal" style={cssVars({ '--i': i })}>
                  <span className="icon-badge icon-badge--muted">
                    <Icon aria-hidden />
                  </span>
                  <div>
                    <h3 className="h3">{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="challenge__closing reveal">{c.closing}</p>
        </div>
      </div>
    </section>
  );
}
