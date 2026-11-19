import { PH } from '../governance';

/**
 * Giveback initiatives (Rainmakers' CSR, "Iniziative impact a supporto della Rainforest italiana"), shown as cards in
 * the track record (team edits, 2026-10-27). Since 2026-11-16 the Giveback branch of the "Cosa fa Rainmakers" chart
 * shows three categories instead of these initiatives. StartuParty and Junior Jedi: cautious descriptions, to be
 * confirmed with the team (no sheet in the company overview); no website on record.
 */
export interface GivebackInitiative {
  slug: string;
  name: string;
  website: string | null;
  /** null: logo-only card, no copy (Imprenditore non sei solo, team request 2026-11-16) */
  summary: { it: string; en: string } | null;
  description: { it: string; en: string } | null;
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
    // {rfOrgs}/{rfItaly}: figures from the Italian Rainforest database (content/shared.ts), filled in by TrackRecord
    summary: s(
      'La mappa dell’ecosistema italiano dell’innovazione: {rfOrgs} organizzazioni mappate, {rfItaly} con sede in Italia.',
      'The map of Italy’s innovation ecosystem: {rfOrgs} organisations mapped, {rfItaly} based in Italy.',
    ),
    description: s(
      'Senza alcuno scopo di lucro e come giveback (CSR) aziendale, Rainmakers ha creato Italian Rainforest: la rappresentazione più completa e dettagliata possibile dell’ecosistema italiano dell’innovazione, con mappa georeferenziata, database e infografica, per renderlo più trasparente, aperto e interconnesso.',
      'On a not-for-profit basis, as its corporate giveback (CSR), Rainmakers created Italian Rainforest: the most complete and detailed picture possible of Italy’s innovation ecosystem, with a geo-referenced map, a database and an infographic, to make it more transparent, open and connected.',
    ),
  },
  // Added 2026-11-16 (team request): logo only, no copy
  {
    slug: 'imprenditore-non-sei-solo',
    name: 'Imprenditore non sei solo',
    website: null,
    summary: null,
    description: null,
  },
  // Added 2026-11-16 (team request): descriptions not supplied yet; Imprenditori anonimi logo supplied 2026-11-17
  {
    slug: 'imprenditori-anonimi',
    name: 'Imprenditori anonimi',
    website: null,
    summary: s(PH.provided, PH.provided),
    description: s(PH.provided, PH.provided),
  },
  {
    slug: 'startup-weekend-italia',
    name: 'Startup Weekend Italia',
    website: null,
    summary: s(PH.provided, PH.provided),
    description: s(PH.provided, PH.provided),
  },
  {
    slug: 'soldi-gratis',
    name: 'Soldi gratis',
    website: null,
    summary: s(PH.provided, PH.provided),
    description: s(PH.provided, PH.provided),
  },
];
