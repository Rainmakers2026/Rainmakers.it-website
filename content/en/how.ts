import type { HowCopy } from '../types';

/** Services: condensed from the company overview (May 2025), one line per business unit. */
export const how: HowCopy = {
  eyebrow: 'How it works',
  title: 'You are at the centre.',
  intro: 'Around you: the people, knowledge and opportunities of the Rainmakers ecosystem.',
  centerLabel: 'You',
  hint: 'Select an item to see what it means for you.',
  mapLabel:
    'Interactive map: the entrepreneur at the centre, connected to people, knowledge, community, opportunities, ecosystem and growth.',
  nodes: [
    { key: 'people', label: 'People', text: 'Founders, experts and investors to learn from.' },
    { key: 'knowledge', label: 'Knowledge', text: 'Hands-on experience with real problems.' },
    { key: 'community', label: 'Community', text: 'Groups where questions and resources circulate.' },
    { key: 'opportunities', label: 'Opportunities', text: 'Partnerships, projects and programmes.' },
    { key: 'ecosystem', label: 'Ecosystem', text: 'Who drives innovation in Italy, mapped by Italian Rainforest.' },
    { key: 'growth', label: 'Growth', text: 'Relationships and knowledge that turn into progress.' },
  ],
  stepsTitle: 'The path',
  steps: [
    { title: 'Connect', text: 'Get in touch with Rainmakers and the community.' },
    { title: 'Learn', text: 'Tap into shared experience and know-how.' },
    { title: 'Discover', text: 'Find people, organisations and opportunities.' },
    { title: 'Collaborate', text: 'Work with founders, experts and partners.' },
    { title: 'Grow', text: 'Turn relationships and knowledge into new opportunities.' },
  ],
  servicesTitle: 'What Rainmakers does',
  services: [
    { name: 'Advisory', text: 'Innovation advisory for companies, institutions and investors.' },
    { name: 'Investments', text: 'Investment advisory for VC funds, family offices and corporate VCs.' },
    { name: 'Club', text: 'Entrepreneurs and intrapreneurs who invest in Tribe startups.' },
    { name: 'Lab', text: 'Marketing, sales, funding, finance, tech, legal and HR as a service.' },
    { name: 'Tribe', text: 'Venture builder & accelerator: startups created or accelerated.' },
    { name: 'Community', text: 'Events, vertical communities and giveback initiatives.' },
  ],
};
