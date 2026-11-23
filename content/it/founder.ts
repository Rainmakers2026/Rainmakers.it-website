import type { FounderCopy } from '../types';

/**
 * Founder section (PRD §6). Only verified facts: founder role and company history
 * (rainmakers.it, company overview), the YouTube channel and video (public YouTube data).
 * Add results, roles or titles here only after the team has confirmed them.
 */
export const founder: FounderCopy = {
  eyebrow: 'Il fondatore',
  title: 'L’impresa ha senso quando è al servizio degli altri.',
  text: 'Costruire un’impresa significa prendere decisioni difficili, spesso da soli. Francesco Inguscio ha fondato Rainmakers nel 2011 per aggregare imprenditori e innovatori italiani (i rainmaker) e mettere a fattor comune le loro esperienze, competenze e relazioni al servizio di chi sta costruendo la propria impresa innovativa.',
  name: 'Francesco Inguscio',
  role: 'Fondatore di Rainmakers',
  photoAlt: 'Francesco Inguscio, fondatore di Rainmakers',
  video: {
    title: 'Francesco Inguscio — Nuovi Occhi (per Imprenditori e Paese), 2014',
    caption: 'Nuovi Occhi (per Imprenditori e Paese) · 2014',
    play: 'Guarda il video',
  },
  linkedinLabel: 'LinkedIn',
  youtubeLabel: 'Canale YouTube',
  substackLabel: 'Italian Rainmaker su Substack',
  portfolio: {
    open: 'Scopri il portfolio',
    title: 'Portfolio di Francesco Inguscio e Rainmakers',
    close: 'Chiudi',
    prev: 'Slide precedente',
    next: 'Slide successiva',
    goTo: 'Vai alla slide {n} di {total}',
    exit: 'Exit',
    min: 'Min',
    off: 'Off',
    soon: 'Coming soon',
    copyright: '©2026 Rainmakers',
  },
};
