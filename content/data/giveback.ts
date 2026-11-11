/**
 * Giveback initiatives (Rainmakers' CSR, "Iniziative a supporto della Rainforest italiana"), shown in the track
 * record after the Tribe and the advisory projects (team edits, 2026-10-27). Same initiatives as the Giveback branch
 * of the "Cosa fa Rainmakers" chart. StartuParty and Junior Jedi: cautious descriptions, to be confirmed with the
 * team (no sheet in the company overview); no website on record.
 */
export interface GivebackInitiative {
  slug: string;
  name: string;
  website: string | null;
  summary: { it: string; en: string };
  description: { it: string; en: string };
}

const s = (it: string, en: string) => ({ it, en });

export const giveback: GivebackInitiative[] = [
  {
    slug: 'startuparty',
    name: 'StartuParty',
    website: null,
    summary: s('Occasioni di incontro per l’ecosistema dell’innovazione.', 'Meet-ups for the innovation ecosystem.'),
    description: s(
      'Un’iniziativa di Giveback di Rainmakers, senza scopo di lucro: momenti informali in cui founder, aspiranti imprenditori, investitori e innovatori si incontrano e si conoscono. Relazioni che diventano progetti, partnership e investimenti.',
      'A not-for-profit Rainmakers Giveback initiative: informal moments where founders, aspiring entrepreneurs, investors and innovators meet and get to know each other. Relationships that turn into projects, partnerships and investments.',
    ),
  },
  {
    slug: 'junior-jedi',
    name: 'Junior Jedi',
    website: null,
    summary: s('Imprenditorialità e innovazione per le nuove generazioni.', 'Entrepreneurship and innovation for the next generation.'),
    description: s(
      'Un’iniziativa di Giveback di Rainmakers, senza scopo di lucro, per avvicinare i più giovani al fare impresa e all’innovazione: sensibilizzazione, formazione e attivazione dei futuri imprenditori e innovatori.',
      'A not-for-profit Rainmakers Giveback initiative bringing young people closer to entrepreneurship and innovation: awareness, training and activation of future entrepreneurs and innovators.',
    ),
  },
  {
    slug: 'italian-rainforest',
    name: 'Italian Rainforest',
    website: null,
    summary: s('La mappa dell’ecosistema italiano dell’innovazione.', 'The map of Italy’s innovation ecosystem.'),
    description: s(
      'Senza alcuno scopo di lucro e come giveback (CSR) aziendale, Rainmakers ha creato Italian Rainforest: la rappresentazione più completa e dettagliata possibile dell’ecosistema italiano dell’innovazione, con mappa georeferenziata, database e infografica, per renderlo più trasparente, aperto e interconnesso.',
      'On a not-for-profit basis, as its corporate giveback (CSR), Rainmakers created Italian Rainforest: the most complete and detailed picture possible of Italy’s innovation ecosystem, with a geo-referenced map, a database and an infographic, to make it more transparent, open and connected.',
    ),
  },
];
