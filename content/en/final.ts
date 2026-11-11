import type { FinalCopy } from '../types';

export const final: FinalCopy = {
  title: 'How do you want to start?',
  intro:
    'A company to innovate, a startup to grow, time and skills to share or the wish to work with us: choose your path, it only takes a few minutes.',
  // Card texts kept to one or two lines (2026-10-26)
  paths: {
    company: {
      title: 'Innovate your company',
      text: 'Tell us your challenge: we shape the project together.',
      cta: 'Let’s talk',
    },
    startup: {
      title: 'Accelerate your startup',
      text: 'Send us your pitch: we review it and get back to you.',
      cta: 'Send your pitch',
    },
    giveback: {
      title: 'Join the Giveback',
      text: 'Put your time and skills to work for the ecosystem.',
      cta: 'Get involved',
    },
    work: {
      title: 'Work with us',
      text: 'Send us your CV and join the Rainmakers team.',
      cta: 'Send your CV',
    },
    invest: {
      title: 'Invest with us',
      text: 'Join the Rainmakers Club with 300+ entrepreneurs.',
      cta: 'Apply',
    },
  },
  newsletter: {
    eyebrow: 'The Rainmakers newsletter',
    title: 'Opportunities don’t fall from the sky.',
    titleAccent: 'Drops of innovation.',
    lead: 'Once a month, a few drops picked by the Rainmakers team: just enough to help your ideas grow and keep you one step ahead.',
    perks: [
      'Ecosystem drops: highlights of Italian innovation',
      'Reading drops: our articles and the month’s most-read posts',
      'Opportunity drops: initiatives and events not to miss',
    ],
    promise: 'One drop a month. Zero spam. Unsubscribe in one click.',
  },
};
