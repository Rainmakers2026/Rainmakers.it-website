import type { WhatCopy } from '../types';

/**
 * "What Rainmakers does" (header "What"): intro, figures and the business unit chart, in one section since
 * 2026-10-27. Texts from the "Italian Rainforest" presentation (Milan, 2026) and the team's edits (2026-10-27 and
 * 2026-11-02): Advisory / Open Venture Building / Giveback. Units: descriptions from the company overview (May 2025).
 */
export const what: WhatCopy = {
  eyebrow: 'Italian innovation platform',
  title: 'What Rainmakers does',
  lead: 'We make large companies innovative with innovation advisory, and innovative companies large with open venture building. Since 2011 we have built synergistic, complementary business units to make innovation happen in Italy: an integrated innovation ecosystem that helps companies grow, inside and outside Rainmakers.',
  stats: [
    { value: '10+', label: 'Giveback initiatives' },
    { value: '30+', label: 'startups launched in every sector' },
    { value: '40+', label: 'innovation advisory projects' },
    { value: '15', label: 'years of meaningful innovation' },
  ],
  // Capital (Venture) removed and Foundation renamed Giveback on 2026-10-27; the Club unit was removed on 2026-10-26;
  // 2026-11-02: Advisory before Open Venture Building, Italian Rainforest Gardener and the Italian Rainforest unit removed
  structure: {
    hint: 'Tap a service to see what we can do for you.',
    label:
      'Chart: Rainmakers at the centre with three branches. Giveback, our CSR: StartuParty, Junior Jedi and Italian Rainforest. Open Venture Building: Accelerator and Builder. Advisory: Innovation and Investment. Each service opens a popup with its description.',
    examplesLabel: 'Some projects',
    close: 'Close',
    branches: [
      {
        key: 'giveback',
        name: 'Giveback',
        tagline: 'Our CSR',
        // Cautious descriptions, to be confirmed with the team (no StartuParty or Junior Jedi sheet in the materials)
        units: [
          {
            name: 'StartuParty',
            text: 'Meet-ups for the innovation ecosystem.',
            brand: 'StartuParty',
            lead: 'A not-for-profit Rainmakers Giveback initiative: informal moments where founders, aspiring entrepreneurs, investors and innovators meet and get to know each other.',
            points: ['Networking open to the whole ecosystem', 'Relationships that turn into projects, partnerships and investments'],
            cta: { label: 'Join the Giveback', path: 'giveback' },
          },
          {
            name: 'Junior Jedi',
            text: 'Entrepreneurship and innovation for the next generation.',
            brand: 'Junior Jedi',
            lead: 'A not-for-profit Rainmakers Giveback initiative bringing young people closer to entrepreneurship and innovation.',
            points: ['Entrepreneurship awareness and training', 'Activating future entrepreneurs and innovators'],
            cta: { label: 'Join the Giveback', path: 'giveback' },
          },
          {
            name: 'Italian Rainforest',
            text: 'The map of Italy’s innovation ecosystem.',
            brand: 'Italian Rainforest',
            lead: 'On a not-for-profit basis, as its corporate giveback (CSR), Rainmakers created Italian Rainforest: the most complete and detailed picture possible of Italy’s innovation ecosystem, to make it more transparent, open and connected.',
            points: ['Geo-referenced map', 'Database', 'Infographic'],
            cta: { label: 'Join the Giveback', path: 'giveback' },
          },
        ],
      },
      {
        key: 'builder',
        name: 'Open Venture Building',
        tagline: 'We make innovative companies large',
        units: [
          {
            name: 'Accelerator',
            text: 'Venture acceleration for startups after product-market fit.',
            brand: 'Rainmakers Accelerator',
            lead: 'Since 2011 we have created, co-founded or accelerated many startups: after {exits} exits, our holdings make up the Tribe, a portfolio of startups bringing meaningful innovation to our Country, People and the Planet.',
            points: [
              'Skills, relationships and services to grow after product-market fit',
              'A place in the Tribe and its network of founders',
              'Active support for incubators, accelerators and operational VCs growing the Italian Rainforest',
            ],
            cta: { label: 'Send your pitch', path: 'startup' },
          },
          {
            name: 'Builder',
            text: 'Venture building for in-house projects.',
            brand: 'Rainmakers Builder',
            lead: 'We provide “as a service” everything a startup needs to grow in a scalable way: with “scaling as a service” we turn a valuable idea into a successful company.',
            points: [
              'Strategy, marketing, sales, fundraising, finance, IT, legal and HR',
              'Open venture building: in-house projects, from idea to company',
              'Meaningful business: strong impact on the innovation ecosystem and on at least one of the 3 Ps',
              'Startup know-how and know-who as a competitive edge',
            ],
            examples: ['Dottor Startup', 'Renditalia'],
            cta: { label: 'Send your pitch', path: 'startup' },
          },
        ],
      },
      {
        key: 'advisory',
        name: 'Advisory',
        tagline: 'We make large companies innovative',
        units: [
          {
            name: 'Innovation',
            text: 'Innovation advisory for SMEs, corporates and investors.',
            brand: 'Rainmakers Innovation',
            lead: 'Since 2011 (first under the Nuvolab brand) we have supported SMEs, corporates and investors, in Italy and abroad, in every initiative involving technology and innovation.',
            points: [
              'Open innovation and digital transformation programmes',
              'Calls for startups and technology scouting',
              'Entrepreneurship training and awareness',
              'Setting up corporate incubators',
              '“Startup on demand”: the right startup for your challenge',
            ],
            cta: { label: 'Innovate your company', path: 'company' },
          },
          {
            name: 'Investment',
            text: 'Investment advisory for VC funds, CVCs and family offices.',
            brand: 'Rainmakers Investment',
            lead: 'We support VC funds, corporate VCs (CVCs) and family offices that want to invest in startups and scaleups, independently or as a sidecar to our club deal.',
            points: [
              'Digital transformation of existing vehicles, or end-to-end set-up and management of new ones',
              'Dealflow generation and partnerships with industry players',
              'Dealflow management and investment selection, through to closing',
              'Support for the growth of investee companies, with our other business units',
            ],
            cta: { label: 'Invest with us', path: 'invest' },
          },
        ],
      },
    ],
  },
  meaningful: {
    title: 'Meaningful innovation.',
    text: 'Rainmakers works only on meaningful innovation: technology in the service of a purpose that truly matters. It is how we do business, in three words that always come back.',
    motto: [
      ['Doing', 'good,'],
      ['done', 'well,'],
      ['that pays', 'well.'],
    ],
    pillarsLabel: 'In the service of the 3 Ps',
    pillars: [
      { title: 'Our country', text: 'Innovative Made in Italy and sectors that are strategic for Italy.' },
      { title: 'People', text: 'Services for people that improve everyday life.' },
      { title: 'The planet', text: 'Cleantech, energy efficiency and the circular economy.' },
    ],
  },
  giveback: {
    eyebrow: 'Our Giveback',
    title: 'A more transparent, open and connected ecosystem.',
    text: 'On a not-for-profit basis, as its corporate giveback (CSR), Rainmakers created Italian Rainforest: the most complete and detailed picture possible of Italy’s innovation ecosystem, to make it more self-aware and better.',
    tools: ['Geo-referenced map', 'Database', 'Infographic'],
  },
};
