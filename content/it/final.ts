import type { FinalCopy } from '../types';

export const final: FinalCopy = {
  title: 'Come vuoi iniziare?',
  intro:
    'Un’azienda da innovare, una startup da far crescere, tempo e competenze da condividere o la voglia di lavorare con noi: scegli il tuo percorso, bastano pochi minuti.',
  // Card texts kept to one or two lines (2026-10-26)
  paths: {
    company: {
      title: 'Innova la tua azienda',
      text: 'Raccontaci la tua sfida: costruiamo insieme il progetto.',
      cta: 'Parliamone',
    },
    startup: {
      title: 'Accelera la tua startup',
      text: 'Inviaci il pitch: lo valutiamo e ti ricontattiamo.',
      cta: 'Invia il pitch',
    },
    giveback: {
      title: 'Unisciti al Giveback',
      text: 'Metti tempo e competenze al servizio dell’ecosistema.',
      cta: 'Contribuisci',
    },
    work: {
      title: 'Lavora con noi',
      text: 'Inviaci il CV ed entra nel team Rainmakers.',
      cta: 'Invia il CV',
    },
    invest: {
      title: 'Investi con noi',
      text: 'Entra nel Rainmakers Club con 300+ imprenditori.',
      cta: 'Candidati',
    },
  },
  newsletter: {
    eyebrow: 'La newsletter di Rainmakers',
    title: 'Le opportunità non cadono dal cielo.',
    titleAccent: 'Gocce di innovazione.',
    lead: 'Una volta al mese, poche gocce scelte dal team Rainmakers: quanto basta per far crescere le tue idee e restare un passo avanti.',
    perks: [
      'Gocce di ecosistema: gli highlight dell’innovazione italiana',
      'Gocce di lettura: i nostri articoli e i post più letti del mese',
      'Gocce di opportunità: iniziative ed eventi da non perdere',
    ],
    promise: 'Una goccia al mese. Zero spam. Ti cancelli con un clic.',
  },
};
