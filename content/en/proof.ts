import type { ProofCopy } from '../types';

/**
 * Testimonials published on the previous rainmakers.it/en (2021).
 * PRD §26: show only if still valid AND authorised → set status to 'VERIFIED' after confirmation.
 */
const source = 'rainmakers.it/en (2021)';

export const proof: ProofCopy = {
  eyebrow: 'From the network',
  title: 'What people who have been part of the ecosystem say',
  testimonials: [
    {
      quote:
        'Thanks to Rainmakers we managed to arrange capital raise with a consistent equity crowdfunding campaign in just 2 months and during the summer period.',
      people: 'Andrea, Francesco and Michele',
      company: 'DIS – Design Italian Shoes',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Working with Rainmakers means being part of a group of “older siblings”, who are ready to support you while you grow with advice based on hands-on experience: business model, contracts, HR, fundraising and a lot of networking.',
      people: 'Giulia and Alessio',
      company: 'Startup Geeks',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Being part of Rainmakers allows having access to a number of opportunities that would otherwise prove difficult to grasp: finding investors, new strategic partners or highly qualified suppliers.',
      people: 'Patrick',
      company: 'DesignWanted',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers was instrumental, helping us develop healthy business relationships when we were only at a startup stage, allowing us to validate our offering and bootstrap our startup until our exit.',
      people: 'Marcello',
      company: 'Coppa+Landini',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers has played a pivotal role in Noonic’s growth and development. As a partner, it always stands up for the founders and the Rainmakers Tribe is one of the very few examples of an actual community of entrepreneurs in Italy.',
      people: 'Nunzio, Nicola and Sebastiano',
      company: 'Noonic',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'From the very foundation until our recognition as leader agency in the Italian conversion marketing field, we always had Rainmakers on our side.',
      people: 'Alessio and Paolo',
      company: 'Instilla',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers proved significantly supportive for CrowdChicken and a top-notch team of on demand professionals tailored for startups.',
      people: 'Andrea',
      company: 'CrowdChicken',
      status: 'TO_VERIFY',
      source,
    },
  ],
};
