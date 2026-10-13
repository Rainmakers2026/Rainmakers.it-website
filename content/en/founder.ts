import type { FounderCopy } from '../types';

/**
 * Founder section (PRD §6). Only verified facts: founder role and company history
 * (rainmakers.it, company overview), the YouTube channel and video (public YouTube data).
 * Add results, roles or titles here only after the team has confirmed them.
 */
export const founder: FounderCopy = {
  eyebrow: 'The founder',
  title: 'Experience matters most when it helps others.',
  text: 'Building a company means making hard decisions, often alone. Francesco Inguscio founded Rainmakers to put experience, expertise and relationships at the service of people building their own.',
  name: 'Francesco Inguscio',
  role: 'Founder of Rainmakers',
  facts: [
    'Rainmakers has been active in Milan since 2011 (as Nuvolab until 2021)',
    'Writes and speaks about entrepreneurship as Italian Rainmaker',
  ],
  photoAlt: 'Francesco Inguscio, founder of Rainmakers',
  video: {
    title: 'Francesco Inguscio — Nuovi Occhi (for entrepreneurs and Italy), 2014, in Italian',
    caption: 'Nuovi Occhi · 2014 · in Italian',
    play: 'Watch the video',
  },
  linkedinLabel: 'LinkedIn',
  youtubeLabel: 'YouTube channel',
  substackLabel: 'Italian Rainmaker on Substack',
  cta: 'Discover Rainmakers',
};
