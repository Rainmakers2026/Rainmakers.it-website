import type { ProofCopy } from '../types';

/**
 * Testimonials published on the previous rainmakers.it (2021).
 * PRD §26: show only if still valid AND authorised → set status to 'VERIFIED' after confirmation.
 * Until then the section is not rendered.
 */
const source = 'rainmakers.it (2021)';

export const proof: ProofCopy = {
  eyebrow: 'Dalla rete',
  title: 'Cosa dice chi ha fatto parte dell’ecosistema',
  testimonials: [
    {
      quote:
        'Grazie a Rainmakers siamo riusciti ad organizzare un aumento di capitale con annessa campagna di equity crowdfunding in soli 2 mesi e in piena estate.',
      people: 'Andrea, Francesco e Michele',
      company: 'DIS – Design Italian Shoes',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Lavorare con Rainmakers significa entrare a far parte di un gruppo di “fratelli maggiori” pronti a supportarti mentre cresci con consigli basati sull’esperienza vissuta: modello di business, contratti, HR, fundraising e molto network.',
      people: 'Giulia e Alessio',
      company: 'Startup Geeks',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Far parte di Rainmakers significa avere accesso a opportunità altrimenti difficili da cogliere, che si tratti di trovare investitori, nuovi partner strategici o fornitori altamente qualificati.',
      people: 'Patrick',
      company: 'DesignWanted',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers per C+L ha significato sviluppare relazioni di business sane nella fase di startup che ci hanno permesso di validare la nostra offering e sviluppare l’azienda in bootstrapping fino alla exit.',
      people: 'Marcello',
      company: 'Coppa+Landini',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers ha avuto un ruolo fondamentale nella crescita di Noonic. È un partner sempre dalla parte dei founders e la Tribe di Rainmakers uno dei pochi esempi di vera community di imprenditori in Italia.',
      people: 'Nunzio, Nicola e Sebastiano',
      company: 'Noonic',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Dalla fondazione fino alla nostra consacrazione come l’agenzia leader in Italia nel conversion marketing abbiamo sempre avuto Rainmakers al nostro fianco.',
      people: 'Alessio e Paolo',
      company: 'Instilla',
      status: 'TO_VERIFY',
      source,
    },
    {
      quote:
        'Rainmakers per CrowdChicken ha significato avere a supporto una squadra on demand di professionisti di primo livello “a misura di startup”.',
      people: 'Andrea',
      company: 'CrowdChicken',
      status: 'TO_VERIFY',
      source,
    },
  ],
};
