import type { AudienceCopy } from '../types';

export const audience: AudienceCopy = {
  eyebrow: 'Per chi è',
  title: 'Per chi costruisce e fa crescere un’impresa.',
  intro:
    'Non serve essere una startup early-stage. Rainmakers parla a chi sta costruendo, facendo crescere o innovando un’impresa e vuole farlo con l’ecosistema, non da solo.',
  primaryTitle: 'Prima di tutto',
  primary: [
    'Founder e imprenditori',
    'Founder di startup e scaleup',
    'Imprenditori di PMI',
    'Intrapreneur e innovation manager',
    'Business leader orientati all’innovazione',
  ],
  secondaryTitle: 'E anche',
  secondary: [
    { title: 'Investitori', text: 'Dealflow, startup e un network imprenditoriale da conoscere.' },
    { title: 'Corporate e innovation manager', text: 'Innovazione, scouting di startup e partnership.' },
    {
      title: 'Attori dell’ecosistema',
      text: 'Acceleratori, incubatori, advisor, università, community, istituzioni e service provider.',
    },
  ],
};
