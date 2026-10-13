import type { ProofCopy } from '../types';

/**
 * "Dicono di noi": testimonials first published on rainmakers.it (2021).
 * Published on the homepage at the Rainmakers team's request (2026-10-13), PRD §26.
 * Set a testimonial back to 'TO_VERIFY' to hide it (e.g. if its author withdraws consent).
 */
const source = 'rainmakers.it (2021)';

export const proof: ProofCopy = {
  eyebrow: 'Dalla Tribe',
  title: 'Dicono di noi',
  intro: 'Founder che hanno fatto piovere opportunità con Rainmakers, nelle loro parole.',
  sourceNote: 'Testimonianze pubblicate su rainmakers.it.',
  review: {
    hook: 'Hai fatto parte della Tribe? La tua storia può ispirare il prossimo founder.',
    cta: 'Lascia una review',
    popTitle: 'Racconta la tua esperienza',
    popText: 'Bastano due minuti: la tua review aiuta altri founder a capire se Rainmakers fa per loro.',
    close: 'Chiudi',
    form: {
      name: 'Nome e cognome',
      email: 'Email',
      company: 'Azienda',
      role: 'Ruolo',
      optional: 'facoltativo',
      rating: 'Com’è andata?',
      ratingLabels: ['1 su 5', '2 su 5', '3 su 5', '4 su 5', '5 su 5'],
      review: 'La tua review',
      reviewHint: 'Cosa è cambiato per la tua impresa grazie a Rainmakers?',
      publishConsent: 'Potete pubblicarla sul sito con il mio nome e la mia azienda.',
      consent: 'Ho letto l’informativa privacy e acconsento al trattamento dei miei dati per questa review.',
      privacy: 'Informativa privacy',
      submit: 'Invia la review',
      submitting: 'Invio in corso…',
      successTitle: 'Grazie, è arrivata!',
      successText: 'Il team Rainmakers la leggerà presto. Se hai acconsentito, potremmo pubblicarla in questa sezione.',
      orPlatform: 'Oppure lasciala sulla piattaforma di recensioni',
      errors: {
        required: 'Campo obbligatorio.',
        email: 'Inserisci un’email valida.',
        consent: 'Per inviare serve il consenso al trattamento dei dati.',
        tooLong: 'Testo troppo lungo.',
        tooShort: 'Scrivi almeno 20 caratteri.',
        summary: 'Controlla i campi evidenziati.',
        generic: 'Invio non riuscito. Riprova o scrivi a info@rainmakers.it.',
        rateLimited: 'Troppi invii ravvicinati. Riprova tra qualche minuto.',
      },
    },
  },
  testimonials: [
    {
      quote:
        'Grazie a Rainmakers siamo riusciti ad organizzare un aumento di capitale con annessa campagna di equity crowdfunding in soli 2 mesi e in piena estate.',
      people: 'Andrea, Francesco e Michele',
      company: 'DIS – Design Italian Shoes',
      logo: 'DIS.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Lavorare con Rainmakers significa entrare a far parte di un gruppo di “fratelli maggiori” pronti a supportarti mentre cresci con consigli basati sull’esperienza vissuta: modello di business, contratti, HR, fundraising e molto network.',
      people: 'Giulia e Alessio',
      company: 'Startup Geeks',
      logo: 'startupgeeks.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Far parte di Rainmakers significa avere accesso a opportunità altrimenti difficili da cogliere, che si tratti di trovare investitori, nuovi partner strategici o fornitori altamente qualificati.',
      people: 'Patrick',
      company: 'DesignWanted',
      logo: 'designwanted.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers per C+L ha significato sviluppare relazioni di business sane nella fase di startup che ci hanno permesso di validare la nostra offering e sviluppare l’azienda in bootstrapping fino alla exit.',
      people: 'Marcello',
      company: 'Coppa+Landini',
      logo: 'coppalandini.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers ha avuto un ruolo fondamentale nella crescita di Noonic. È un partner sempre dalla parte dei founders e la Tribe di Rainmakers uno dei pochi esempi di vera community di imprenditori in Italia.',
      people: 'Nunzio, Nicola e Sebastiano',
      company: 'Noonic',
      logo: 'noonic.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Dalla fondazione fino alla nostra consacrazione come l’agenzia leader in Italia nel conversion marketing abbiamo sempre avuto Rainmakers al nostro fianco.',
      people: 'Alessio e Paolo',
      company: 'Instilla',
      logo: 'instilla.webp',
      status: 'VERIFIED',
      source,
    },
    {
      quote:
        'Rainmakers per CrowdChicken ha significato avere a supporto una squadra on demand di professionisti di primo livello “a misura di startup”.',
      people: 'Andrea',
      company: 'CrowdChicken',
      logo: 'crowdchicken.webp',
      status: 'VERIFIED',
      source,
    },
  ],
};
