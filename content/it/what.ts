import type { WhatCopy } from '../types';

/**
 * "Cosa fa Rainmakers" (header "Cosa"): intro, metriche e schema delle business unit, in un'unica sezione dal
 * 2026-10-27. Testi dalla presentazione "Italian Rainforest" (Milano, 2026) e dagli edit del team (2026-10-27 e
 * 2026-11-02): Advisory / Open Venture Building / Giveback. Unità: descrizioni dal company overview (maggio 2025).
 */
export const what: WhatCopy = {
  eyebrow: 'Italian innovation platform',
  title: 'Cosa fa Rainmakers',
  lead: 'Rendiamo innovative le grandi aziende con innovation advisory e grandi le aziende innovative con open venture building. Dal 2011 abbiamo sviluppato business unit sinergiche e complementari per far accadere l’innovazione in Italia: un innovation ecosystem integrato per far crescere le aziende, dentro e fuori Rainmakers.',
  stats: [
    { value: '10+', label: 'iniziative di Giveback' },
    { value: '30+', label: 'startup lanciate in ogni settore' },
    { value: '40+', label: 'progetti di innovation advisory' },
    { value: '15', label: 'anni di meaningful innovation' },
  ],
  // Capital (Venture) tolto e Foundation diventata Giveback il 2026-10-27; la unit Club era stata tolta il 2026-10-26;
  // 2026-11-10: ordine Giveback → Open Venture Building → Advisory, Italian Rainforest terza unit del Giveback
  structure: {
    hint: 'Tocca un servizio per scoprire cosa possiamo fare per te.',
    label:
      'Schema: Rainmakers al centro, con tre rami. Giveback, la nostra CSR: iniziative informative e formative, di attivazione e di Giveback puro. Open Venture Building: Accelerator e Builder. Advisory: Innovation e Investment. Ogni servizio apre un popup con la descrizione.',
    examplesLabel: 'Alcuni progetti',
    close: 'Chiudi',
    branches: [
      {
        key: 'giveback',
        name: 'Giveback',
        tagline: 'La nostra CSR',
        // 2026-11-16: tre categorie di iniziative al posto delle singole iniziative (che restano come card nel track
        // record); testi del team. 2026-11-18: popup spiegati meglio (introduzione e punti) su richiesta del team, dalla
        // scheda Foundation del portfolio del founder e dalle descrizioni delle iniziative (content/data/giveback.ts)
        units: [
          {
            name: 'Informative e formative',
            text: 'Sul fare impresa innovativa in Italia.',
            brand: 'Iniziative informative e formative',
            lead: 'Condividiamo gratuitamente quello che abbiamo imparato in 15 anni di startup e innovazione, perché chi vuole fare impresa innovativa in Italia parta con le informazioni e le competenze giuste.',
            points: [
              'Informazione sul mondo dell’innovazione italiana: protagonisti, numeri e tendenze dell’ecosistema',
              'Formazione sul fare impresa e innovazione in Italia, per founder e aspiranti imprenditori',
              'Sensibilizzazione delle nuove generazioni all’imprenditorialità e all’innovazione',
            ],
            cta: { label: 'Unisciti al Giveback', path: 'giveback' },
          },
          {
            name: 'Di attivazione',
            text: 'Degli aspiranti imprenditori e innovatori italiani.',
            brand: 'Iniziative di attivazione',
            lead: 'Aiutiamo chi ha un’idea a fare il primo passo: creiamo le occasioni per mettersi alla prova, conoscere le persone giuste e trasformare un’intenzione in un progetto concreto.',
            points: [
              'Esperienze pratiche in cui aspiranti imprenditori e innovatori mettono alla prova le proprie idee',
              'Occasioni di incontro tra founder, investitori, mentor e innovatori',
              'Relazioni che diventano team, progetti, partnership e investimenti',
            ],
            cta: { label: 'Unisciti al Giveback', path: 'giveback' },
          },
          {
            name: 'Di Giveback puro',
            text: 'Per la Rainforest italiana.',
            brand: 'Iniziative di Giveback puro',
            lead: 'Sono le iniziative che portiamo avanti senza alcun ritorno economico, per restituire qualcosa all’ecosistema italiano dell’innovazione, la Rainforest italiana, che ci ha fatto crescere. Mettiamo a disposizione di tutti tempo, competenze, dati e relazioni.',
            points: [
              'Senza scopo di lucro: nessun ricavo, nessuna partecipazione, nessun cliente da acquisire',
              'Strumenti e conoscenza aperti a tutto l’ecosistema, come la mappa di Italian Rainforest',
              'Il tempo e le competenze del team al servizio di chi costruisce l’innovazione in Italia',
              'L’obiettivo: un ecosistema più trasparente, aperto e interconnesso, a beneficio di tutti',
            ],
            cta: { label: 'Unisciti al Giveback', path: 'giveback' },
          },
        ],
      },
      {
        key: 'builder',
        name: 'Open Venture Building',
        tagline: 'Rendiamo grandi le aziende innovative',
        units: [
          {
            name: 'Accelerator',
            text: 'Venture acceleration per startup dopo il product market fit.',
            brand: 'Rainmakers Accelerator',
            lead: 'Dal 2011 abbiamo creato, co-fondato o accelerato numerose startup: dopo {exits} exit, le nostre partecipazioni formano la Tribe, il portafoglio di startup che portano meaningful innovation al Paese, alle Persone e al Pianeta.',
            points: [
              'Competenze, relazioni e servizi per crescere dopo il product market fit',
              'L’ingresso nella Tribe e nella sua rete di founder',
              'Il supporto attivo a incubatori, acceleratori e operational VC che fanno crescere la Rainforest italiana',
            ],
            cta: { label: 'Invia il pitch', path: 'startup' },
          },
          {
            name: 'Builder',
            text: 'Venture building per progetti interni.',
            brand: 'Rainmakers Builder',
            lead: 'Forniamo “as a service” tutto ciò che serve a una startup per crescere in modo scalabile: con lo “scaling as a service” trasformiamo un’idea di valore in un’impresa di successo.',
            points: [
              'Strategy, marketing, sales, fundraising, finance, IT, legal e HR',
              'Open venture building: progetti interni, dall’idea all’impresa',
              'Meaningful business: forte impatto sull’ecosistema dell’innovazione e su almeno una delle 3 P',
              'Il know-how e il know-who del mondo startup come vantaggio competitivo',
            ],
            examples: ['Dottor Startup', 'Renditalia'],
            cta: { label: 'Invia il pitch', path: 'startup' },
          },
        ],
      },
      {
        key: 'advisory',
        name: 'Advisory',
        tagline: 'Rendiamo innovative le grandi aziende',
        units: [
          {
            name: 'Innovation',
            text: 'Innovation advisory per PMI, corporate e investitori.',
            brand: 'Rainmakers Innovation',
            lead: 'Dal 2011 (prima con il brand Nuvolab) affianchiamo PMI, corporate e investitori, italiani e non, in tutte le iniziative che riguardano tecnologia e innovazione.',
            points: [
              'Programmi di open innovation e digital transformation',
              'Call for startup e scouting tecnologici',
              'Formazione e sensibilizzazione all’imprenditorialità',
              'Creazione di corporate incubator',
              '“Startup on demand”: la startup giusta per la tua sfida',
            ],
            cta: { label: 'Innova la tua azienda', path: 'company' },
          },
          {
            name: 'Investment',
            text: 'Investment advisory per fondi VC, CVC e family office.',
            brand: 'Rainmakers Investment',
            lead: 'Affianchiamo fondi VC, corporate VC (CVC) e family office che vogliono investire in startup e scaleup, in modo indipendente o come sidecar del nostro club deal.',
            points: [
              'Digital transformation di veicoli esistenti, o setup e gestione end-to-end di nuovi veicoli',
              'Dealflow generation e partnership con i player di settore',
              'Dealflow management e selezione degli investimenti, fino al closing',
              'Supporto alla crescita delle società investite, con le altre business unit',
            ],
            cta: { label: 'Investi con noi', path: 'invest' },
          },
        ],
      },
    ],
  },
  meaningful: {
    title: 'Meaningful innovation.',
    text: 'Rainmakers si occupa solo di meaningful innovation: tecnologia al servizio di uno scopo che conta davvero. È il nostro modo di fare impresa, in tre parole che tornano sempre.',
    motto: [
      ['Il', 'bene,'],
      ['fatto', 'bene,'],
      ['che paga', 'bene.'],
    ],
    pillarsLabel: 'Al servizio delle 3 P',
    pillars: [
      { title: 'Paese', text: 'Innovative Made in Italy e settori strategici per l’Italia.' },
      { title: 'Persone', text: 'Servizi alla persona, che migliorano la vita di tutti i giorni.' },
      { title: 'Pianeta', text: 'Cleantech, efficienza energetica ed economia circolare.' },
    ],
  },
  giveback: {
    eyebrow: 'Il nostro Giveback',
    title: 'Un ecosistema più trasparente, aperto e interconnesso.',
    text: 'Senza alcuno scopo di lucro e come giveback (CSR) aziendale, Rainmakers ha creato Italian Rainforest: la rappresentazione più completa e dettagliata possibile dell’ecosistema italiano dell’innovazione, per renderlo più auto-consapevole e migliore.',
    tools: ['Mappa georeferenziata', 'Database', 'Infografica'],
  },
};
