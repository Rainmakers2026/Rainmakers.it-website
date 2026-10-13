import type { ProofCopy } from '../types';

/**
 * "What they say about us": testimonials first published on rainmakers.it/en (2021).
 * Published on the homepage at the Rainmakers team's request (2026-10-13), PRD §26.
 * Set a testimonial back to 'TO_VERIFY' to hide it (e.g. if its author withdraws consent).
 */
const source = 'rainmakers.it/en (2021)';

export const proof: ProofCopy = {
  eyebrow: 'From the Tribe',
  title: 'What they say about us',
  intro: 'Founders who made opportunities rain with Rainmakers, in their own words.',
  sourceNote: 'Testimonials published on rainmakers.it.',
  review: {
    hook: 'Been part of the Tribe? Your story could inspire the next founder.',
    cta: 'Leave a review',
    subject: 'My Rainmakers review',
    body: 'Name and company:\nHow Rainmakers helped you:\nMay we publish it on the website? (yes/no)\n',
  },
  testimonials: [
    {
      quote:
        'Thanks to Rainmakers we managed to arrange capital raise with a consistent equity crowdfunding campaign in just 2 months and during the summer period.',
      people: 'Andrea, Francesco and Michele',
      company: 'DIS – Design Italian Shoes',
      logo: 'DIS.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Working with Rainmakers means being part of a group of “older siblings”, who are ready to support you while you grow with advice based on hands-on experience: business model, contracts, HR, fundraising and a lot of networking.',
      people: 'Giulia and Alessio',
      company: 'Startup Geeks',
      logo: 'startupgeeks.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Being part of Rainmakers allows having access to a number of opportunities that would otherwise prove difficult to grasp: finding investors, new strategic partners or highly qualified suppliers.',
      people: 'Patrick',
      company: 'DesignWanted',
      logo: 'designwanted.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers was instrumental, helping us develop healthy business relationships when we were only at a startup stage, allowing us to validate our offering and bootstrap our startup until our exit.',
      people: 'Marcello',
      company: 'Coppa+Landini',
      logo: 'coppalandini.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers has played a pivotal role in Noonic’s growth and development. As a partner, it always stands up for the founders and the Rainmakers Tribe is one of the very few examples of an actual community of entrepreneurs in Italy.',
      people: 'Nunzio, Nicola and Sebastiano',
      company: 'Noonic',
      logo: 'noonic.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'From the very foundation until our recognition as leader agency in the Italian conversion marketing field, we always had Rainmakers on our side.',
      people: 'Alessio and Paolo',
      company: 'Instilla',
      logo: 'instilla.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers proved significantly supportive for CrowdChicken and a top-notch team of on demand professionals tailored for startups.',
      people: 'Andrea',
      company: 'CrowdChicken',
      logo: 'crowdchicken.webp',
      status: 'VERIFIED',
      source,
    },
  ],
};
