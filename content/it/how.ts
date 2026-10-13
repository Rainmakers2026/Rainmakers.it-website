import type { HowCopy } from '../types';

/** Services: condensed from the company overview (maggio 2025), one line per business unit. */
export const how: HowCopy = {
  eyebrow: 'Come funziona',
  title: 'Al centro ci sei tu.',
  intro: 'Intorno a te, le persone, le conoscenze e le opportunità dell’ecosistema Rainmakers.',
  centerLabel: 'Tu',
  hint: 'Seleziona un elemento per scoprire cosa significa per te.',
  mapLabel:
    'Mappa interattiva: l’imprenditore al centro, collegato a persone, conoscenza, community, opportunità, ecosistema e crescita.',
  nodes: [
    { key: 'people', label: 'Persone', text: 'Founder, esperti e investitori con cui confrontarti.' },
    { key: 'knowledge', label: 'Conoscenza', text: 'Esperienza pratica su problemi reali.' },
    { key: 'community', label: 'Community', text: 'Gruppi in cui circolano domande e risorse.' },
    { key: 'opportunities', label: 'Opportunità', text: 'Partnership, progetti e programmi.' },
    { key: 'ecosystem', label: 'Ecosistema', text: 'Chi fa innovazione in Italia, mappato da Italian Rainforest.' },
    { key: 'growth', label: 'Crescita', text: 'Relazioni e conoscenze che diventano passi avanti.' },
  ],
  stepsTitle: 'Il percorso',
  steps: [
    { title: 'Connettiti', text: 'Entra in contatto con Rainmakers e la community.' },
    { title: 'Impara', text: 'Accedi a esperienze e conoscenze condivise.' },
    { title: 'Scopri', text: 'Trova persone, organizzazioni e opportunità.' },
    { title: 'Collabora', text: 'Lavora con founder, esperti e partner.' },
    { title: 'Cresci', text: 'Trasforma relazioni e conoscenze in nuove opportunità.' },
  ],
  servicesTitle: 'Cosa fa Rainmakers',
  services: [
    { name: 'Advisory', text: 'Innovation advisory per aziende, istituzioni e investitori.' },
    { name: 'Investments', text: 'Investment advisory per fondi VC, family office e corporate VC.' },
    { name: 'Club', text: 'Imprenditori e intrapreneur che investono nelle startup della Tribe.' },
    { name: 'Lab', text: 'Marketing, vendite, funding, finanza, tech, legale e HR as a service.' },
    { name: 'Tribe', text: 'Venture builder & accelerator: startup create o accelerate.' },
    { name: 'Community', text: 'Eventi, community verticali e iniziative di giveback.' },
  ],
};
