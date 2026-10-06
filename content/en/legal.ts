import type { LegalCopy } from '../types';
import { PH } from '../governance';

export const legal: LegalCopy = {
  privacy: {
    title: 'Privacy policy',
    draftNotice: 'DRAFT — To be validated by legal counsel/DPO before publication. Placeholder fields must be completed.',
    updated: `Last updated: ${PH.provided}`,
    sections: [
      { title: '1. Data controller', body: [`Controller: ${PH.provided}`, `Privacy contact: ${PH.provided}`] },
      {
        title: '2. Data we collect',
        body: [
          'Data you enter in the “Connect with Rainmakers” form: first name, last name, email, company, role, profile and, if you provide them, website or LinkedIn and what you are looking for.',
          'Technical data: page language, campaign parameters (UTM) and IP address, used only to prevent abuse and not stored.',
          'Aggregated, anonymous visit statistics via Vercel Web Analytics, which does not use cookies.',
        ],
      },
      {
        title: '3. Purposes and legal basis',
        body: [
          'Getting back to you and pointing you to people, communities and resources in the ecosystem: consent (Art. 6.1.a GDPR).',
          'Preventing spam and abuse of the form: legitimate interest (Art. 6.1.f GDPR).',
        ],
      },
      { title: '4. Retention', body: [`Retention period: ${PH.provided}`] },
      {
        title: '5. Recipients',
        body: [
          'Authorised Rainmakers staff and providers acting as processors: Supabase (database) and Vercel (hosting).',
          `Hosting region and safeguards for any non-EU transfer: ${PH.provided}`,
          'Data is never sold or shared with third parties for marketing purposes.',
        ],
      },
      {
        title: '6. Your rights',
        body: [
          'You can request access, rectification, erasure, restriction and portability of your data and withdraw consent at any time by writing to the contact in section 1.',
          'You can also lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).',
        ],
      },
    ],
    back: 'Back to home',
  },
  cookies: {
    title: 'Cookie policy',
    draftNotice: 'DRAFT — To be validated by legal counsel/DPO before publication.',
    updated: `Last updated: ${PH.provided}`,
    sections: [
      {
        title: '1. Cookies used by this site',
        body: [
          'This site does not use profiling or advertising cookies.',
          'Visit statistics are collected with Vercel Web Analytics in aggregated, anonymous form, without cookies and without identifying individual visitors.',
        ],
      },
      {
        title: '2. External sites',
        body: ['Links to Italian Rainforest, WhatsApp and other sites lead to services with their own cookie and privacy policies.'],
      },
      {
        title: '3. Changes',
        body: ['If we introduce tools that use non-technical cookies, we will update this page and ask for your consent before enabling them.'],
      },
    ],
    back: 'Back to home',
  },
};
