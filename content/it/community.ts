import type { CommunityCopy } from '../types';
import { PH } from '../governance';

export const community: CommunityCopy = {
  eyebrow: 'Community',
  title: 'Le idee crescono quando incontrano le persone giuste.',
  text: 'Nelle community WhatsApp di Rainmakers fai domande, conosci altri founder e scopri opportunità.',
  listTitle: 'Scegli la tua community',
  join: 'Entra su WhatsApp',
  full: 'Al completo',
  comingSoon: 'In arrivo',
  linkMissing: PH.whatsapp,
  categoryLabel: 'Tema',
  targetLabel: 'Per',
  note: 'Non sai quale scegliere?',
  form: {
    intro: 'Lasciaci nome ed email: ti mostriamo subito il link per entrare.',
    firstName: 'Nome',
    email: 'Email',
    consent:
      'Acconsento al trattamento dei miei dati per gestire la richiesta di accesso alla community. Non è un’iscrizione alla newsletter.',
    privacy: 'Informativa privacy',
    submit: 'Continua',
    submitting: 'Invio…',
    cancel: 'Annulla',
    success: 'Fatto! Ecco il link per entrare nella community.',
    open: 'Apri WhatsApp',
    errors: {
      required: 'Compila questo campo.',
      email: 'Inserisci un indirizzo email valido.',
      consent: 'Serve il consenso al trattamento dei dati.',
      tooLong: 'Il testo è troppo lungo.',
      summary: 'Controlla i campi indicati.',
      generic: 'Non è stato possibile inviare la richiesta. Riprova tra qualche istante.',
      rateLimited: 'Hai inviato troppe richieste. Riprova tra qualche minuto.',
    },
  },
};
