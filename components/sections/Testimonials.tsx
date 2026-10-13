'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { Locale } from '@/content/types';

const reviews = {
  it: [
    {
      quote: 'Rainmakers per CrowdChicken ha significato avere a supporto una squadra on demand di professionisti di primo livello “a misura di startup”.',
      name: 'Andrea',
      company: 'CrowdChicken',
      logo: 'crowdchicken.webp',
    },
    {
      quote: 'Rainmakers ha avuto un ruolo fondamentale nella crescita di Noonic. È un partner sempre dalla parte dei founder e la Tribe è una vera community di imprenditori.',
      name: 'Nunzio, Nicola e Sebastiano',
      company: 'Noonic',
      logo: 'noonic.webp',
    },
    {
      quote: 'Lavorare con Rainmakers significa entrare a far parte di un gruppo di “fratelli maggiori” pronti a supportarti mentre cresci, con consigli basati sull’esperienza vissuta.',
      name: 'Giulia e Alessio',
      company: 'Startup Geeks',
      logo: 'startupgeeks.webp',
    },
  ],
  en: [
    {
      quote: 'For CrowdChicken, Rainmakers meant having an on-demand team of top-tier professionals supporting us, with the flexibility a startup needs.',
      name: 'Andrea',
      company: 'CrowdChicken',
      logo: 'crowdchicken.webp',
    },
    {
      quote: 'Rainmakers played a key role in Noonic’s growth: a partner always on the founders’ side and a true community of entrepreneurs.',
      name: 'Nunzio, Nicola and Sebastiano',
      company: 'Noonic',
      logo: 'noonic.webp',
    },
    {
      quote: 'Working with Rainmakers means joining a group of “big siblings” ready to support you as you grow, with advice grounded in real experience.',
      name: 'Giulia and Alessio',
      company: 'Startup Geeks',
      logo: 'startupgeeks.webp',
    },
  ],
} as const;

/** Renders only the reviews whose company is listed in `verified`; nothing at all when none is. */
export function Testimonials({ locale, verified }: { locale: Locale; verified: string[] }) {
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const it = locale === 'it';
  const items = reviews[locale].filter((r) => verified.includes(r.company));
  const scrollToReview = (index: number) => {
    const container = list.current;
    const card = container?.querySelector<HTMLElement>('.testimonial');
    if (!container || !card) return;
    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    container.scrollTo({ left: index * (card.offsetWidth + gap), behavior });
  };
  const handleScroll = () => {
    const container = list.current;
    const card = container?.querySelector<HTMLElement>('.testimonial');
    if (!container || !card) return;
    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
    setActive(Math.min(items.length - 1, Math.round(container.scrollLeft / (card.offsetWidth + gap))));
  };

  if (!items.length) return null;

  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials__top">
        <div className="testimonials__intro">
          <p className="eyebrow">{it ? 'Le parole di chi ci conosce' : 'In their own words'}</p>
          <h3 id="testimonials-title">{it ? 'Dicono di noi' : 'What they say about us'}</h3>
          <p className="testimonials__lead">
            {it
              ? 'Esperienze reali di founder e team che hanno percorso la crescita insieme a noi.'
              : 'Real stories from founders and teams who have grown alongside us.'}
          </p>
        </div>
        <div className="testimonials__controls">
          <button
            type="button"
            onClick={() => scrollToReview(Math.max(0, active - 1))}
            aria-label={it ? 'Recensione precedente' : 'Previous review'}
            disabled={active === 0}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollToReview(Math.min(items.length - 1, active + 1))}
            aria-label={it ? 'Recensione successiva' : 'Next review'}
            disabled={active === items.length - 1}
          >
            →
          </button>
        </div>
      </div>
      <div
        className="testimonials__list"
        ref={list}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label={it ? 'Recensioni' : 'Testimonials'}
      >
        {items.map((review) => (
          <article className="testimonial" key={review.company}>
            <div className="testimonial__company">
              <span className="testimonial__logo">
                <Image
                  src={`/brand/The-Tribe-companies-favicons/${review.logo}`}
                  alt=""
                  width={48}
                  height={48}
                />
              </span>
              <span className="testimonial__company-name">
                <strong>{review.company}</strong>
                <span>{it ? 'Community Tribe' : 'Tribe community'}</span>
              </span>
            </div>
            <span className="testimonial__mark" aria-hidden>“</span>
            <blockquote>{review.quote}</blockquote>
            <div className="testimonial__author">
              <strong>{review.name}</strong>
              <small>{it ? 'Testimonianza' : 'Testimonial'}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="testimonials__navigation">
        <div
          className="testimonials__pagination"
          role="group"
          aria-label={it ? 'Seleziona una testimonianza' : 'Select a testimonial'}
        >
          {items.map((review, index) => (
            <button
              type="button"
              key={review.company}
              onClick={() => scrollToReview(index)}
              aria-label={it ? `Vai alla testimonianza ${index + 1}` : `Go to testimonial ${index + 1}`}
              aria-current={active === index ? 'true' : undefined}
            />
          ))}
        </div>
        <span className="testimonials__count" aria-live="polite">
          {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
      </div>
      <p className="testimonials__source">
        <a href="https://www.rainmakers.it/" target="_blank" rel="noreferrer">
          {it ? 'Scopri tutte le testimonianze' : 'Explore all testimonials'} <span aria-hidden>↗</span>
        </a>
      </p>
    </section>
  );
}
