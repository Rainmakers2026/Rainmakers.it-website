import type { NetworkCopy } from '../types';

export const network: NetworkCopy = {
  eyebrow: 'Il network',
  title: 'L’innovazione non nasce in isolamento.',
  intro:
    'Un ecosistema dell’innovazione è fatto di relazioni. Imprenditori, competenze, capitale, community, istituzioni, corporate e startup crescono quando si incontrano. Rainmakers lavora per far avvenire questi incontri.',
  centerLabel: 'Rainmakers',
  hint: 'Seleziona un nodo per vedere chi rappresenta e come si collega agli altri.',
  nodes: [
    { key: 'entrepreneurs', label: 'Imprenditori', text: 'Chi costruisce imprese e cerca persone, mercati e opportunità per crescere.' },
    { key: 'expertise', label: 'Competenze', text: 'Professionisti ed esperti che portano conoscenza pratica su problemi reali.' },
    { key: 'capital', label: 'Capitale', text: 'Investitori, fondi e business angel alla ricerca di progetti in cui credere.' },
    { key: 'communities', label: 'Community', text: 'Gruppi in cui circolano domande, risorse e opportunità.' },
    { key: 'institutions', label: 'Istituzioni', text: 'Enti, università e programmi che sostengono l’innovazione sul territorio.' },
    { key: 'corporates', label: 'Corporate', text: 'Aziende che cercano innovazione, partnership e nuove soluzioni.' },
    { key: 'startups', label: 'Startup', text: 'Nuove imprese che portano tecnologie e modelli di business sul mercato.' },
  ],
  mapLabel:
    'Mappa interattiva del network: Rainmakers al centro, collegato a imprenditori, competenze, capitale, community, istituzioni, corporate e startup, a loro volta collegati tra loro.',
  layersTitle: 'Tre livelli, un solo percorso',
  layers: [
    { name: 'Rainmakers.it', role: 'Il punto d’ingresso', text: 'Capisci cos’è l’ecosistema e cosa puoi trovarci.' },
    { name: 'Italian Rainforest', role: 'L’intelligenza dell’ecosistema', text: 'Scopri chi opera nell’ecosistema italiano dell’innovazione.' },
    { name: 'Community WhatsApp', role: 'Il livello umano', text: 'Entra in contatto con le persone e partecipa alle conversazioni.' },
  ],
};
