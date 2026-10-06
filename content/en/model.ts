import type { ModelCopy } from '../types';

/** Source: Rainmakers company overview, May 2025 — "Our how" and business unit slides. */
export const model: ModelCopy = {
  eyebrow: 'The Rainmakers model',
  title: 'Six business units, one network.',
  intro:
    'Since 2011 Rainmakers has built synergistic, complementary business units, becoming an integrated VDO (venture development organisation) that grows both internal and external companies. Here is what they mean for people building a company.',
  forYouLabel: 'For you',
  units: [
    {
      key: 'advisory',
      name: 'Rainmakers Advisory',
      tagline: 'We make large companies innovative',
      text: 'An innovation advisor since 2011 (first under the Nuvolab brand), supporting SMEs, corporates, institutions and investors in their technology and innovation initiatives.',
      forYou: 'If your company wants to innovate, open up to startups or train its people.',
      items: ['Open innovation', 'Digital transformation', 'Training and awareness', 'Calls for startups', 'Technology scouting', 'Corporate incubators', 'Startup on demand'],
      stat: { value: '{advisory}', label: 'documented projects' },
      link: { label: 'See the advisory projects', target: 'advisory' },
    },
    {
      key: 'investments',
      name: 'Rainmakers Investments',
      tagline: 'Investment advisory',
      text: 'Advisory for VC funds, family offices and corporate VCs investing in startups and scaleups, independently or as a sidecar to our club deal: digital transformation of existing vehicles or end-to-end set-up and management of new ones.',
      forYou: 'If you manage capital or want to build an investment vehicle.',
      items: ['Investment vehicle set-up', 'Dealflow generation and partnerships', 'Dealflow management', 'Investment selection through closing', 'Support for portfolio companies'],
    },
    {
      key: 'club',
      name: 'Rainmakers Club',
      tagline: 'Meaningful money',
      text: 'Our club deal of entrepreneurs and intrapreneurs backing Rainmakers startups and scaleups: beyond funds, they contribute expertise and relationships in the sectors and functions that matter for growth.',
      forYou: 'If you are an entrepreneur or intrapreneur and want to invest capital, skills and relationships in Tribe startups.',
      stat: { value: '300+', label: 'entrepreneurs and intrapreneurs' },
    },
    {
      key: 'lab',
      name: 'Rainmakers Lab',
      tagline: 'Scaling as a service',
      text: 'All the services a startup needs to grow in a scalable way, delivered by Rainmakers, by controlled or portfolio startups and by partners.',
      forYou: 'If your startup needs to grow without building everything in-house.',
      items: [
        'Marketing as a service — communicating innovation',
        'Sales as a service — business development and sales teams',
        'Funding as a service — equity, debt and public funding',
        'Finance as a service — admin, tax, controlling, investor reporting',
        'Tech as a service — IT development and management',
        'Legal as a service — legal support',
        'HRM as a service — recruiting and HR lifecycle',
        'X-aaS — more coming soon',
      ],
    },
    {
      key: 'tribe',
      name: 'Rainmakers Tribe',
      tagline: 'Venture builder & accelerator',
      text: 'As a venture accelerator and startup studio, since 2011 Rainmakers has created, co-founded or accelerated many startups bringing meaningful innovation. It also supports other players in the Italian Rainforest (incubators, accelerators, operational VCs), investing where possible.',
      forYou: 'If you are looking for founders who have been there, or for vertical skills and platforms.',
      stat: { value: '{exits} exits', label: 'and significant stakes in {active} startups' },
      link: { label: 'Explore the Tribe', target: 'tribe' },
    },
    {
      key: 'community',
      name: 'Rainmakers Community',
      tagline: 'The network behind innovation',
      text: 'Gatherings for Italian ecosystem players through regular networking events, vertical communities run directly or through the Tribe, partner selection for innovation projects and giveback initiatives.',
      forYou: 'If you want to enter the ecosystem: events, communities and free guidance for aspiring entrepreneurs.',
      items: ['Networking events', 'Vertical communities', 'Partner selection', 'Giveback: free education and guidance', 'On the board of InnovUp'],
    },
  ],
};
