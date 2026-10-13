import type { LegalCopy } from '../types';
import { PH } from '../governance';

export const legal: LegalCopy = {
  privacy: {
    title: 'Informativa privacy',
    draftNotice:
      'BOZZA — Testo da validare con il consulente legale/DPO prima della pubblicazione. I campi segnati come placeholder vanno completati.',
    updated: `Ultimo aggiornamento: ${PH.provided}`,
    sections: [
      {
        title: '1. Titolare del trattamento',
        body: [`Titolare: ${PH.provided}`, `Contatto privacy: ${PH.provided}`],
      },
      {
        title: '2. Dati raccolti',
        body: [
          'Dati che inserisci nel modulo “Connettiti con Rainmakers”: nome, cognome, email, azienda, ruolo, profilo e, se li indichi, sito web o LinkedIn e cosa stai cercando.',
          'Per la newsletter: email, lingua scelta e consenso, con data e stato dell’iscrizione.',
          'Dati tecnici: lingua della pagina, parametri della campagna di provenienza (UTM) e indirizzo IP, usato solo per prevenire abusi e non conservato.',
          'Statistiche di visita aggregate e anonime tramite Vercel Web Analytics, che non usa cookie.',
        ],
      },
      {
        title: '3. Finalità e base giuridica',
        body: [
          'Ricontattarti e indicarti persone, community e risorse dell’ecosistema: consenso (art. 6.1.a GDPR).',
          'Inviarti la newsletter mensile con articoli, novità tech ed eventi: consenso, revocabile in qualsiasi momento.',
          'Prevenire spam e abusi del modulo: legittimo interesse (art. 6.1.f GDPR).',
        ],
      },
      { title: '4. Conservazione', body: [`Periodo di conservazione: ${PH.provided}`] },
      {
        title: '5. Destinatari',
        body: [
          'Personale autorizzato di Rainmakers e fornitori che agiscono come responsabili del trattamento: Supabase (database) e Vercel (hosting).',
          'Gli articoli di Francesco Inguscio su Substack sono pubblicati da un servizio esterno, soggetto alla propria informativa privacy.',
          `Regione di hosting e garanzie per eventuali trasferimenti extra-UE: ${PH.provided}`,
          'I dati non vengono venduti né ceduti a terzi per finalità di marketing.',
        ],
      },
      {
        title: '6. I tuoi diritti',
        body: [
          'Puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati e revocare il consenso in qualsiasi momento, scrivendo al contatto indicato al punto 1.',
          'Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.',
        ],
      },
    ],
    back: 'Torna alla home',
  },
  cookies: {
    title: 'Cookie policy',
    draftNotice: 'BOZZA — Testo da validare con il consulente legale/DPO prima della pubblicazione.',
    updated: `Ultimo aggiornamento: ${PH.provided}`,
    sections: [
      {
        title: '1. Cookie usati da questo sito',
        body: [
          'Questo sito non usa cookie di profilazione né cookie pubblicitari.',
          'Le statistiche di visita sono raccolte con Vercel Web Analytics in forma aggregata e anonima, senza cookie e senza identificare il singolo visitatore.',
        ],
      },
      {
        title: '2. Siti esterni',
        body: [
          'I link verso Italian Rainforest, WhatsApp e altri siti portano a servizi con proprie policy su cookie e privacy, che ti invitiamo a consultare.',
        ],
      },
      {
        title: '3. Modifiche',
        body: [
          'Se in futuro introdurremo strumenti che usano cookie non tecnici, aggiorneremo questa pagina e chiederemo il tuo consenso prima di attivarli.',
        ],
      },
    ],
    back: 'Torna alla home',
  },
};
