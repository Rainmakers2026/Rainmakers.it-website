'use client';

import { useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import Image from 'next/image';
import type { FounderCopy, Locale } from '@/content/types';
import { track } from '@/lib/analytics';
import { ArrowRight, Close } from '../icons';
import { YouTubeFacade } from '../YouTubeFacade';
import type { PfIntro, PfLogo, PfSlide } from './resolve';

type Copy = FounderCopy['portfolio'];

/** **highlighted** words of the slides, in the brand colour */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
    </>
  );
}

/** Rainmakers mark + unit name, small and centred at the top of a slide. */
function Lockup({ unit, as: Tag = 'h3', id }: { unit: string; as?: 'h3' | 'p'; id?: string }) {
  return (
    <Tag className="pf-lockup" id={id}>
      <Image src="/brand/logo-mark-white.png" alt="" width={46} height={46} className="pf-lockup__mark" />
      <span className="pf-lockup__text">
        <span className="pf-lockup__name">
          Rainmakers{unit ? <span className="pf-lockup__unit"> {unit}</span> : null}
        </span>
        <span className="pf-lockup__claim">meaningful innovation</span>
      </span>
    </Tag>
  );
}

function Logo({ logo, copy }: { logo: PfLogo; copy: Copy }) {
  return (
    <span className={`pf-logo${logo.look ? ` pf-logo--${logo.look}` : ''}${logo.soon ? ' pf-logo--soon' : ''}`} title={logo.name}>
      {logo.src ? (
        <Image src={logo.src} alt={logo.name} width={logo.width} height={logo.height} sizes={`${logo.width}px`} style={{ width: logo.width, maxWidth: '100%', height: 'auto' }} />
      ) : (
        <span className="pf-logo__word">{logo.name}</span>
      )}
      {logo.badge ? <span className={`pf-badge pf-badge--${logo.badge}`}>{copy[logo.badge]}</span> : null}
      {logo.soon ? <span className="pf-soon">{copy.soon}</span> : null}
    </span>
  );
}

function Logos({ logos, copy, className = '', last }: { logos: PfLogo[]; copy: Copy; className?: string; last?: string }) {
  return (
    <ul className={`pf-logos ${className}`}>
      {logos.map((l) => (
        <li key={l.name}>
          <Logo logo={l} copy={copy} />
        </li>
      ))}
      {/* Tribe panel: "…more coming soon.." in the last cell, as on the slide */}
      {last ? <li className="pf-logos__more">{last}</li> : null}
    </ul>
  );
}

function IntroSlide({ intro, copy, photo, photoAlt, titleId }: { intro: PfIntro; copy: Copy; photo: string | null; photoAlt: string; titleId: string }) {
  return (
    <div className="pf-intro">
      <h3 className="pf-intro__name" id={titleId}>
        {intro.name}
      </h3>
      <div className="pf-intro__cols">
        <section>
          <h4 className="pf-intro__label">{intro.studied}</h4>
          <Logos logos={intro.studiedAt} copy={copy} className="pf-logos--stack" />
        </section>
        <section>
          <h4 className="pf-intro__label">{intro.worked}</h4>
          <Logos logos={intro.workedAt} copy={copy} className="pf-logos--two" />
        </section>
        <section className="pf-intro__now">
          <h4 className="pf-intro__label">{intro.doing}</h4>
          <div className="pf-intro__now-body">
            <Lockup unit="" as="p" />
            {photo ? (
              <span className="pf-intro__photo">
                <Image src={photo} alt={photoAlt} fill sizes="(max-width: 700px) 120px, 168px" />
              </span>
            ) : null}
          </div>
        </section>
      </div>
      <p className="pf-intro__more">
        {intro.moreInfo}{' '}
        <a href={intro.linkedin.url} target="_blank" rel="noopener">
          {intro.linkedin.label}
        </a>
      </p>
    </div>
  );
}

function UnitSlide({ slide, copy, active, locale, play, titleId }: { slide: PfSlide; copy: Copy; active: boolean; locale: Locale; play: string; titleId: string }) {
  const aside: ReactNode = slide.video ? (
    // the player stays inside the popup; it is unmounted when the slide changes, which stops the video
    active ? (
      <div className="pf-video">
        <YouTubeFacade videoId={slide.video.id} title={slide.video.title} play={play} locale={locale} />
      </div>
    ) : (
      <div className="pf-video pf-video--idle" />
    )
  ) : slide.id === 'accelerator' && slide.logos ? (
    <div className="pf-tribe">
      <div className="pf-tribe__panel">
        <Logos logos={slide.logos} copy={copy} className="pf-logos--tribe" last={slide.panelNote} />
      </div>
      {slide.moreLogos ? <Logos logos={slide.moreLogos} copy={copy} className="pf-logos--tribe pf-logos--below" /> : null}
    </div>
  ) : slide.logos ? (
    <Logos logos={slide.logos} copy={copy} className={`pf-logos--grid pf-logos--n${Math.min(slide.logos.length, 4)}`} />
  ) : slide.stat ? (
    <p className="pf-stat">
      <span className="pf-stat__value">{slide.stat.value}</span>
      <span className="pf-stat__label">{slide.stat.label}</span>
    </p>
  ) : slide.soon ? (
    <p className="pf-stat pf-stat--soon">
      <span className="pf-stat__value">{slide.soon}</span>
      <Image src="/brand/logo-mark-white.png" alt="" width={44} height={44} className="pf-stat__mark" />
    </p>
  ) : null;

  return (
    <div className="pf-unit">
      <Lockup unit={slide.unit} id={titleId} />
      <div className={`pf-unit__body${aside ? '' : ' pf-unit__body--single'}`}>
        <div className="pf-text">
          {slide.lead ? (
            <p className="pf-text__lead">
              <Rich text={slide.lead} />
            </p>
          ) : null}
          {slide.paragraphs.map((p) => (
            <p key={p}>
              <Rich text={p} />
            </p>
          ))}
          {slide.bulletsIntro ? (
            <p>
              <Rich text={slide.bulletsIntro} />
            </p>
          ) : null}
          {slide.bullets ? (
            <ul className="pf-bullets">
              {slide.bullets.map((b) => (
                <li key={b}>
                  <Image src="/brand/logo-mark-white.png" alt="" width={18} height={18} />
                  <span>
                    <Rich text={b} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {aside ? <div className="pf-aside">{aside}</div> : null}
      </div>
    </div>
  );
}

/**
 * Founder portfolio (2026-11-17): a button under the founder's name opens a large translucent popup with the team's
 * slides as a carousel — dots, arrows, keyboard (← →) and swipe. Nothing is loaded until it opens; the video plays
 * inside the popup.
 */
export function FounderPortfolio({
  copy,
  intro,
  slides,
  photo,
  photoAlt,
  play,
  locale,
}: {
  copy: Copy;
  intro: PfIntro;
  slides: PfSlide[];
  photo: string | null;
  photoAlt: string;
  play: string;
  locale: Locale;
}) {
  const uid = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const swipe = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const total = slides.length + 1;
  const go = (i: number) => setIndex((i + total) % total);

  // deep link: #portfolio opens the carousel, #portfolio-4 opens it on the 4th slide
  useEffect(() => {
    const m = window.location.hash.match(/^#portfolio(?:-(\d+))?$/);
    if (!m) return;
    setIndex(Math.min(Math.max(Number(m[1] ?? 1), 1), total) - 1);
    setOpen(true);
  }, [total]);

  useEffect(() => {
    const d = dialog.current;
    if (open && d && !d.open) d.showModal();
    document.documentElement.classList.toggle('modal-open', open);
    return () => document.documentElement.classList.remove('modal-open');
  }, [open]);

  const close = () => dialog.current?.close();
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };
  const label = (n: number) => copy.goTo.replace('{n}', String(n)).replace('{total}', String(total));

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="pf-open"
        aria-haspopup="dialog"
        onClick={() => {
          setIndex(0);
          setOpen(true);
          track('founder_portfolio_open', { locale });
        }}
      >
        <span>{copy.open}</span>
        <ArrowRight aria-hidden />
      </button>

      <dialog
        ref={dialog}
        className="pf-dialog"
        aria-label={copy.title}
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
        onClick={onDialogClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1);
          if (e.key === 'ArrowLeft') go(index - 1);
        }}
      >
        {open ? (
          <div className="pf">
            <button type="button" className="pf__close" onClick={close} aria-label={copy.close}>
              <Close aria-hidden />
            </button>

            <div className="pf__viewport" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
              <ol className="pf__track" style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}>
                <li className="pf__slide" aria-roledescription="slide" aria-labelledby={`${uid}-s0`} inert={index !== 0 ? true : undefined}>
                  <IntroSlide intro={intro} copy={copy} photo={photo} photoAlt={photoAlt} titleId={`${uid}-s0`} />
                </li>
                {slides.map((s, i) => (
                  <li key={s.id} className="pf__slide" aria-roledescription="slide" aria-labelledby={`${uid}-s${i + 1}`} inert={index !== i + 1 ? true : undefined}>
                    <UnitSlide slide={s} copy={copy} active={index === i + 1} locale={locale} play={play} titleId={`${uid}-s${i + 1}`} />
                  </li>
                ))}
              </ol>
            </div>

            <div className="pf__nav">
              <button type="button" className="pf__arrow pf__arrow--prev" onClick={() => go(index - 1)} aria-label={copy.prev}>
                <ArrowRight aria-hidden />
              </button>
              <ol className="pf__dots">
                {Array.from({ length: total }, (_, i) => (
                  <li key={i}>
                    <button type="button" className="pf__dot" aria-label={label(i + 1)} aria-current={i === index ? 'true' : undefined} onClick={() => go(i)} />
                  </li>
                ))}
              </ol>
              <button type="button" className="pf__arrow" onClick={() => go(index + 1)} aria-label={copy.next}>
                <ArrowRight aria-hidden />
              </button>
            </div>
            <p className="pf__copy">{copy.copyright}</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
