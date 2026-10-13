import type { FounderCopy } from '../types';

/**
 * Founder section (PRD §6). Only verified facts: founder role and company history
 * (rainmakers.it, company overview), the YouTube channel and video (public YouTube data).
 * Add results, roles or titles here only after the team has confirmed them.
 */
export const founder: FounderCopy = {
  eyebrow: 'Il fondatore',
  title: 'L’esperienza prende valore quando diventa utile agli altri.',
  text: 'Costruire un’impresa significa prendere decisioni difficili, spesso da soli. Francesco Inguscio ha fondato Rainmakers per mettere esperienza, competenze e relazioni al servizio di chi sta costruendo la propria.',
  name: 'Francesco Inguscio',
  role: 'Fondatore di Rainmakers',
  facts: [
    'Rainmakers è attiva a Milano dal 2011 (fino al 2021 come Nuvolab)',
    'Scrive e parla di imprenditorialità come Italian Rainmaker',
  ],
  photoAlt: 'Francesco Inguscio, fondatore di Rainmakers',
  video: {
    title: 'Francesco Inguscio — Nuovi Occhi (per Imprenditori e Paese), 2014',
    caption: 'Nuovi Occhi (per Imprenditori e Paese) · 2014',
    play: 'Guarda il video',
  },
  linkedinLabel: 'LinkedIn',
  youtubeLabel: 'Canale YouTube',
  substackLabel: 'Italian Rainmaker su Substack',
  cta: 'Scopri Rainmakers',
};
