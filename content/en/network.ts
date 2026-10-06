import type { NetworkCopy } from '../types';

export const network: NetworkCopy = {
  eyebrow: 'The network',
  title: 'Innovation does not happen in isolation.',
  intro:
    'An innovation ecosystem is made of relationships. Entrepreneurs, expertise, capital, communities, institutions, corporates and startups grow when they meet. Rainmakers works to make those meetings happen.',
  centerLabel: 'Rainmakers',
  hint: 'Select a node to see who it represents and how it connects to the others.',
  nodes: [
    { key: 'entrepreneurs', label: 'Entrepreneurs', text: 'People building companies and looking for people, markets and opportunities to grow.' },
    { key: 'expertise', label: 'Expertise', text: 'Professionals and experts bringing practical knowledge to real problems.' },
    { key: 'capital', label: 'Capital', text: 'Investors, funds and business angels looking for projects to back.' },
    { key: 'communities', label: 'Communities', text: 'Groups where questions, resources and opportunities circulate.' },
    { key: 'institutions', label: 'Institutions', text: 'Public bodies, universities and programmes supporting innovation.' },
    { key: 'corporates', label: 'Corporates', text: 'Companies looking for innovation, partnerships and new solutions.' },
    { key: 'startups', label: 'Startups', text: 'New companies bringing technologies and business models to market.' },
  ],
  mapLabel:
    'Interactive network map: Rainmakers at the centre, connected to entrepreneurs, expertise, capital, communities, institutions, corporates and startups, which are also connected to each other.',
  layersTitle: 'Three layers, one path',
  layers: [
    { name: 'Rainmakers.it', role: 'The gateway', text: 'Understand what the ecosystem is and what you can find in it.' },
    { name: 'Italian Rainforest', role: 'The ecosystem intelligence layer', text: 'Discover who operates in Italy’s innovation ecosystem.' },
    { name: 'WhatsApp communities', role: 'The human layer', text: 'Get in touch with people and join the conversations.' },
  ],
};
