import type { FounderCopy } from '../types';

/**
 * Founder section (PRD §6). Only verified facts: founder role and company history
 * (rainmakers.it, company overview), the YouTube channel and video (public YouTube data).
 * Add results, roles or titles here only after the team has confirmed them.
 */
export const founder: FounderCopy = {
  eyebrow: 'The founder',
  title: 'Business makes sense when it serves others.',
  text: 'Building a company means making hard decisions, often alone. Francesco Inguscio founded Rainmakers in 2011 to bring together Italian entrepreneurs and innovators (the rainmakers) and pool their experience, expertise and relationships in the service of people building their own innovative company.',
  name: 'Francesco Inguscio',
  role: 'Founder of Rainmakers',
  photoAlt: 'Francesco Inguscio, founder of Rainmakers',
  video: {
    title: 'Francesco Inguscio — Nuovi Occhi (for entrepreneurs and Italy), 2014, in Italian',
    caption: 'Nuovi Occhi · 2014 · in Italian',
    play: 'Watch the video',
  },
  linkedinLabel: 'LinkedIn',
  youtubeLabel: 'YouTube channel',
  substackLabel: 'Italian Rainmaker on Substack',
  portfolio: {
    open: 'View the portfolio',
    title: 'Francesco Inguscio and Rainmakers portfolio',
    close: 'Close',
    prev: 'Previous slide',
    next: 'Next slide',
    goTo: 'Go to slide {n} of {total}',
    exit: 'Exit',
    min: 'Min',
    off: 'Off',
    soon: 'Coming soon',
    copyright: '©2026 Rainmakers',
  },
};
