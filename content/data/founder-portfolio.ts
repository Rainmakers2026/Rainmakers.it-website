/**
 * Founder portfolio carousel (2026-11-17): the team's slides on Francesco Inguscio and the Rainmakers units, redrawn
 * as a popup carousel opened from the founder section. Italian text exactly as on the slides; **…** marks the
 * highlighted words. Order requested by the team: Francesco and Rainmakers first, then Giveback (Foundation),
 * Open Venture Building (Accelerator, Builder), Advisory (Innovation, Investment), then Venture and Club; within each
 * group the slides keep their numbering.
 * Logos: `site` = white logo already used on the site (/brand/logos-white), `pf` = cut from the slides
 * (/brand/portfolio, scripts/generate-portfolio-logos.cjs), `word` = white wordmark (no usable logo yet).
 */
import type { Locale } from '../types';

type L<T> = Record<Locale, T>;
const l = <T,>(it: T, en: T): L<T> => ({ it, en });

export interface PortfolioLogo {
  name: string;
  /** site:<file> | pf:<name> | word */
  src: `site:${string}` | `pf:${string}` | 'word';
  /** Marker on the logo, as on the Accelerator slide */
  badge?: 'exit' | 'min' | 'off';
  /** black: white logo on a black disc (Junior Jedi, StartuParty); faded: logo to be updated */
  look?: 'black' | 'faded';
  /** "Coming soon" tag clipped on the logo (Dottor Startup, 2027) */
  soon?: boolean;
}

export interface PortfolioSlide {
  id: string;
  /** Rainmakers lockup at the top centre: '' = Rainmakers, otherwise the unit ("Innovation", "Builder"…) */
  unit: string;
  /** Bold question opening the slide */
  lead?: L<string>;
  paragraphs: L<string[]>;
  bulletsIntro?: L<string>;
  bullets?: L<string[]>;
  logos?: PortfolioLogo[];
  /** Accelerator: the Tribe panel, then the minority stakes and the companies no longer active */
  panelNote?: L<string>;
  moreLogos?: PortfolioLogo[];
  video?: { id: string; title: L<string> };
  stat?: { value: string; label: L<string> };
  soon?: L<string>;
}

export interface FounderIntro {
  name: string;
  studied: L<string>;
  worked: L<string>;
  doing: L<string>;
  studiedAt: PortfolioLogo[];
  workedAt: PortfolioLogo[];
  moreInfo: L<string>;
  linkedin: { label: string; url: string };
}

export const founderIntro: FounderIntro = {
  name: 'Francesco Inguscio',
  studied: l('Studia @', 'Studied @'),
  worked: l('Lavora @', 'Worked @'),
  doing: l('Doing good, having fun, making money @', 'Doing good, having fun, making money @'),
  studiedAt: [
    { name: 'Università degli Studi di Padova', src: 'pf:padova' },
    { name: 'University of Salford', src: 'pf:salford' },
    { name: 'Scuola Universitaria Superiore Sant’Anna Pisa', src: 'pf:santanna' },
    { name: 'Santa Clara University', src: 'pf:santaclara' },
    { name: 'Fulbright BEST — Business Exchange and Student Training', src: 'pf:fulbright' },
  ],
  workedAt: [
    { name: 'Prometeia', src: 'pf:prometeia' },
    { name: 'Accenture', src: 'pf:accenture' },
    { name: 'IBM', src: 'pf:ibm' },
    { name: 'BZM — Buttignon Zotti Milan & Co.', src: 'pf:bzm' },
    { name: 'US MAC — US Market Access Center', src: 'pf:usmac' },
    { name: 'The Angels’ Forum', src: 'pf:angelsforum' },
    { name: 'M31', src: 'pf:m31' },
    { name: 'LUISS EnLabs — The Startup Factory', src: 'pf:luissenlabs' },
  ],
  moreInfo: l('More info:', 'More info:'),
  linkedin: { label: 'linkedin.com/in/italianrainmaker', url: 'https://www.linkedin.com/in/italianrainmaker' },
};

const tribe: PortfolioLogo[] = [
  { name: 'impactscool', src: 'pf:impactscool', badge: 'exit' },
  { name: 'Coppa+Landini', src: 'site:coppalandini.webp', badge: 'exit' },
  { name: 'CrowdChicken', src: 'site:crowdchicken.webp', badge: 'exit' },
  { name: 'Instilla', src: 'site:instilla.webp', badge: 'exit' },
  { name: 'This is not a sushi bar', src: 'site:thisisnotsushibar.webp', badge: 'exit' },
  { name: 'Backbone', src: 'site:backbone.webp', badge: 'exit' },
  { name: 'startuphome.io', src: 'site:startuphome.webp', badge: 'exit' },
  { name: 'Fornace', src: 'site:fornacestudio.webp', badge: 'exit' },
  { name: 'Verbalizza', src: 'site:verbalizza.webp', badge: 'exit' },
  { name: 'Mercurion', src: 'word', badge: 'exit' },
  { name: 'Noonic', src: 'site:noonic.webp' },
  { name: 'Future Fashion', src: 'pf:futurefashion' },
  { name: 'Design Wanted', src: 'site:designwanted.webp' },
  { name: 'Easysea', src: 'site:easysea.webp' },
  { name: 'Zanze XVI', src: 'site:zanzexvi.webp' },
  { name: 'Kampaay', src: 'site:kampaay.webp' },
  { name: 'Sano e Sazio', src: 'pf:sanoesazio' },
  { name: 'Startup Geeks', src: 'site:startupgeeks.webp' },
  { name: 'Trovabando', src: 'site:trovabando.webp' },
];

export const portfolioSlides: PortfolioSlide[] = [
  {
    id: 'rainmakers',
    unit: '',
    paragraphs: l(
      [
        'Rainmakers è la **Italian innovation platform** attiva dal 2011 a Milano che **supporta a vario titolo tutti gli attori dell’ecosistema** dell’innovazione italiano (imprenditori, investitori, corporate, incubatori, acceleratori, venture builder, istituzioni, soggetti formativi e informativi, altri tipi di abilitatori, etc..), operando laddove possibile sia **sinergicamente** ad essi che con le proprie business unit in **competizione** con essi, soprattutto quando sinergie operative interne o inefficienze di mercato esterne lo renda più efficiente.',
      ],
      [
        'Rainmakers is the **Italian innovation platform**, active in Milan since 2011, that **supports in many ways all the players of the ecosystem** of Italian innovation (entrepreneurs, investors, corporates, incubators, accelerators, venture builders, institutions, education and information providers, other kinds of enablers, etc.), working wherever possible both **in synergy** with them and, with its own business units, **in competition** with them, especially when internal operating synergies or external market inefficiencies make it more efficient.',
      ],
    ),
  },
  {
    id: 'meaningful',
    unit: '',
    lead: l(
      'Perchè pensare dicotomicamente l’imprenditore che fa azienda in modo profittevole e l’operatore che crea impatto sociale con le sue azioni?',
      'Why think of the entrepreneur who builds a profitable company and the operator who creates social impact with their actions as opposites?',
    ),
    paragraphs: l(
      [
        'E’ tempo di **superare questa dicotomia** che vede contrapposto il **turbo capitalista** (che fa “il male, fatto bene che paga bene”) e il **soggetto “impact”** (che fa “il bene, fatto bene, che paga male”).',
        'E’ possibile fare “il bene, fatto bene, che paga bene” creando **imprenditori impact che utilizzino tutte le tecniche lean del mondo startup con obiettivi di creare business model scalabili che però siano orientati al bene**. Questa **“meaningful innovation”** che abilita una **“meaningful entrepreneurship”** è al centro della nostra attività.',
      ],
      [
        'It is time to **overcome this dichotomy** that pits the **turbo-capitalist** (doing “bad, done well, that pays well”) against the **“impact” player** (doing “good, done well, that pays badly”).',
        'It is possible to do “good, done well, that pays well” by creating **impact entrepreneurs who use all the lean techniques of the startup world to build scalable business models that are nonetheless aimed at the good**. This **“meaningful innovation”**, enabling a **“meaningful entrepreneurship”**, is at the heart of what we do.',
      ],
    ),
    video: {
      id: 'letNCtzNvng',
      title: l(
        'Francesco Inguscio | Rainmakers — Techstars Startup Weekend Food Sustainability Parma 2021',
        'Francesco Inguscio | Rainmakers — Techstars Startup Weekend Food Sustainability Parma 2021',
      ),
    },
  },
  {
    id: 'foundation',
    unit: 'Foundation',
    paragraphs: l(
      [
        '**Rainmakers Foundation** è/sarà la nostra entità “for purpose” e non “for profit” a cui fanno capo tutte le iniziative di **supporto dell’ecosistema dell’innovazione italiano**, la c.d. **Italian Rainforest**.',
      ],
      [
        '**Rainmakers Foundation** is/will be our “for purpose”, not “for profit” entity, home to all the initiatives **supporting the Italian innovation ecosystem**, the so-called **Italian Rainforest**.',
      ],
    ),
    bulletsIntro: l('Ricordiamo tra le iniziative portate avanti dalle Fondazione quelle:', 'Among the initiatives carried out by the Foundation:'),
    bullets: l(
      [
        '**informative** sul mondo innovazione italiano;',
        '**formative** sul fare impresa e innovazione in Italia;',
        '**di attivazione** degli aspiranti imprenditori e innovatori;',
        '**di rappresentanza** politica dell’ecosistema;',
        '**di giveback** puro;',
      ],
      [
        '**informative** ones on the Italian innovation world;',
        '**educational** ones on entrepreneurship and innovation in Italy;',
        '**activation** of aspiring entrepreneurs and innovators;',
        'political **representation** of the ecosystem;',
        'pure **giveback**;',
      ],
    ),
    logos: [
      { name: 'Junior Jedi', src: 'site:juniorjedi.webp', look: 'black' },
      { name: 'Startup Geeks', src: 'site:startupgeeks.webp' },
      { name: 'InnovUp', src: 'pf:innovup' },
      { name: 'StartuParty', src: 'site:startuparty.webp', look: 'black' },
      { name: 'Soldi Gratis', src: 'site:soldigratis.webp' },
      { name: 'Imprenditori anonimi', src: 'site:imprenditorianonimi.webp' },
      { name: 'Italian Rainforest', src: 'site:italianrainforest.webp' },
      { name: 'Startup Weekend', src: 'pf:startupweekend', look: 'faded' },
    ],
  },
  {
    id: 'accelerator',
    unit: 'Accelerator',
    paragraphs: l(
      [
        'Rainmakers come **venture accelerator e startup studio** a partire dal 2011 ha creato, co-fondato e/o accelerato lo sviluppo di numerose startup.',
        'Oggi, dopo 8 exit detiene partecipazioni rilevanti in 11 di esse, che costituiscono la nostra **Tribe**, il nostro portafoglio di startup, portatrici di meaningful innovation per il **Paese**, per le **Persone** e per il **Pianeta**.',
        'Partecipa inoltre allo **sviluppo della Rainforest italiana** supportando attivamente altri player dell’ecosistema (incubatori, acceleratori e operational VC) e, laddove possibile, investendo in essi.',
      ],
      [
        'As a **venture accelerator and startup studio**, since 2011 Rainmakers has created, co-founded and/or accelerated the growth of many startups.',
        'Today, after 8 exits, it holds significant stakes in 11 of them, which make up our **Tribe**, our portfolio of startups bringing meaningful innovation to the **Country**, to **People** and to the **Planet**.',
        'It also takes part in the **growth of the Italian Rainforest** by actively supporting other players of the ecosystem (incubators, accelerators and operational VCs) and, where possible, investing in them.',
      ],
    ),
    logos: tribe,
    panelNote: l('…more coming soon..', '…more coming soon..'),
    moreLogos: [
      { name: 'Gellify', src: 'site:gellify.webp', badge: 'min' },
      { name: 'Startup Wise Guys', src: 'site:startupwiseguys.webp', badge: 'min' },
      { name: 'Airlite', src: 'pf:airlite', badge: 'min' },
      { name: 'WAMI — Water with a mission', src: 'pf:wami', badge: 'min' },
      { name: 'Ncode', src: 'site:ncode.webp' },
      { name: 'Mapadore', src: 'site:mapadore.webp', badge: 'off' },
      { name: 'Robo for IT', src: 'site:robo4it.webp', badge: 'off' },
      { name: 'bidtotrip', src: 'site:bidtotrip.webp', badge: 'off' },
    ],
  },
  {
    id: 'builder',
    unit: 'Builder',
    paragraphs: l(
      [
        '**Rainmakers Venture Builder** fornisce “as a service” tutti i servizi che consentono a una startup di crescere in modo scalabile (strategy, marketing, sales, fundraising, finance, IT, legal, HRM etc..) trasformando grazie al suo “**scaling as a service**” qualsiasi idea di valore in impresa di successo. Opera principalmente su **startup interne o su progetti di terzi** in fase iniziale di sviluppo (**open venture building**).',
        'Il primo filone progettuale su cui si concentra inizialmente il venture builder sono **meaningful business** ovvero business con forte impatto su almeno sull’ecosistema dell’innovazione e 1 “P” in cui il know how e know who veicolato da Rainmakers e proveniente dal mondo startup, forniscono il vantaggio competitivo utile per queste aziende a trasformarsi in aziende leader dei rispettivi settori di appartenenza.',
      ],
      [
        '**Rainmakers Venture Builder** provides “as a service” all the services a startup needs to grow in a scalable way (strategy, marketing, sales, fundraising, finance, IT, legal, HRM etc.), turning any valuable idea into a successful company through its “**scaling as a service**”. It works mainly on **internal startups or third-party projects** at an early stage (**open venture building**).',
        'The first stream the venture builder focuses on is **meaningful businesses**: businesses with a strong impact at least on the innovation ecosystem and on 1 “P”, where the know-how and know-who brought by Rainmakers from the startup world give these companies the competitive edge to become leaders in their sectors.',
      ],
    ),
    logos: [
      { name: 'Dottor Startup', src: 'pf:dottorstartup', soon: true },
      { name: 'Renditalia', src: 'pf:renditalia' },
      { name: 'Chi Odia Paga', src: 'site:chiodiapaga.webp', badge: 'off' },
    ],
  },
  {
    id: 'innovation',
    unit: 'Innovation',
    paragraphs: l(
      [
        '**Rainmakers Innovation Advisory** come **innovation advisor** a partire dal 2011 (prima con il brand Nuvolab) supporta PMI, Corporate, Istituzioni ed Investitori nelle loro iniziative che riguardano tecnologia ed innovazione.',
        'Programmi di **open innovation** e **digital transformation**, iniziative di **formazione** e sensibilizzazione in ambito imprenditoriale, organizzazione di **call for startup** e di **scouting tecnologici**, supporto alla creazione di **corporate incubator**, servizio di “**startup on demand**” sono solo alcune tipologie di servizi erogati nel corso degli anni.',
      ],
      [
        'As an **innovation advisor** since 2011 (first under the Nuvolab brand), **Rainmakers Innovation Advisory** supports SMEs, corporates, institutions and investors in their technology and innovation initiatives.',
        '**Open innovation** and **digital transformation** programmes, entrepreneurship **training** and awareness initiatives, **calls for startups** and **technology scouting**, support in setting up **corporate incubators**, a “**startup on demand**” service: just some of the services delivered over the years.',
      ],
    ),
    logos: [
      { name: 'Crédit Agricole — Le Village', src: 'site:credit-agricole-levillagebyca.webp' },
      { name: 'Confindustria', src: 'pf:confindustria' },
      { name: 'Officine Formative — Intesa Sanpaolo', src: 'pf:officineformative' },
      { name: 'UniCredit Start Lab', src: 'site:unicreditstartlab.webp' },
      { name: 'Agos', src: 'site:agos.webp' },
      { name: 'Gruppo Finservice', src: 'site:gruppofinservice.webp' },
      { name: 'Vita', src: 'site:vita.webp' },
      { name: 'EY', src: 'site:ey.webp' },
      { name: 'RCS MediaGroup', src: 'pf:rcs' },
      { name: 'Talent Garden', src: 'site:talentgarden.webp' },
      { name: 'Assintel', src: 'pf:assintel' },
      { name: 'Tetra Pak', src: 'site:tetrapak.webp' },
      { name: 'ART-ER', src: 'site:art-er.webp' },
      { name: 'Università degli Studi di Milano-Bicocca', src: 'pf:unimib' },
      { name: 'ibicocca', src: 'site:ibicocca.unimib.webp' },
      { name: 'Electrolux', src: 'site:electrolux.webp' },
    ],
  },
  {
    id: 'investment',
    unit: 'Investment',
    paragraphs: l(
      [
        '**Rainmakers Investment Advisory** è la nostra attività di **investment advisory per fondi VC, family office e corporate VC** che vogliono investire in startup e scaleup, in modo indipendente o come sidecar del nostro club deal.',
        'Offriamo supporto di **digital transformation di soggetti pre-esistenti o di setup e gestione end-to-end di veicoli di investimento neo costituiti**, dalla dealflow generation e la definizione di partnership con player di settore, al successivo dealflow management, fino ad arrivare a tutte le attività connesse alla selezione degli investimenti fino al closing; con le altre nostre business unit inoltre **supportiamo lo sviluppo delle società investite dai nostri Clienti**.',
      ],
      [
        '**Rainmakers Investment Advisory** is our **investment advisory for VC funds, family offices and corporate VCs** that want to invest in startups and scaleups, independently or as a sidecar to our club deal.',
        'We support the **digital transformation of existing players or the end-to-end setup and management of newly created investment vehicles**, from dealflow generation and partnerships with industry players to dealflow management, up to every activity linked to selecting investments through to closing; with our other business units we also **support the growth of the companies our Clients invest in**.',
      ],
    ),
    logos: [
      { name: 'CDP Venture Capital — Fondo Nazionale Innovazione', src: 'site:cdpventurecapital.webp' },
      { name: '360 Capital', src: 'site:360capitalpartners.webp' },
      { name: 'Oltre Impact', src: 'site:oltreimpact.webp' },
      { name: 'Azimut Investments', src: 'pf:azimut' },
      { name: 'Mamacrowd', src: 'site:mamacrowd.webp' },
      { name: 'BAN Trentino', src: 'pf:bantrentino' },
      { name: 'Innovatec Group', src: 'pf:innovatec' },
    ],
  },
  {
    id: 'venture',
    unit: 'Venture',
    paragraphs: l(
      ['**Rainmakers VC** è la nostra practice di **operational venture capital** in fase di lancio e che privilegerà nelle sue strategie di finanziamento:'],
      ['**Rainmakers VC** is our **operational venture capital** practice, being launched, whose financing strategies will favour:'],
    ),
    bullets: l(
      [
        '**direttamente: startup** che trasformino la **meaningful innovation** in realtà (beyond impact);',
        '**indirettamente**: **operatori hands-on** che, come Rainmakers, supportino le partecipate in modo imprenditorialmente attivo;',
      ],
      [
        '**directly: startups** that turn **meaningful innovation** into reality (beyond impact);',
        '**indirectly**: **hands-on operators** that, like Rainmakers, support their portfolio companies in an entrepreneurially active way;',
      ],
    ),
    soon: l('coming soon', 'coming soon'),
  },
  {
    id: 'club',
    unit: 'Club',
    paragraphs: l(
      [
        '**Rainmakers Club** è il nostro **club deal** composto da **imprenditori ed intrapreneur** che sostengono lo sviluppo delle nostre startup e scaleup fornendo **meaningful money**: oltre ai loro fondi, anche le loro competenze e relazioni pertinenti gli specifici settori di interesse delle nostre partecipate e le aree funzionali di maggiore interesse per il loro sviluppo.',
        'Al nostro club accedono anche gli imprenditori clienti delle altre nostre business unit, potendo investire in modo congiunto e disgiunto rispetto ai fondi di cui siamo advisor, supportando le startup della nostra Tribe e aiutando lo sviluppo dei servizi del nostro Lab.',
      ],
      [
        '**Rainmakers Club** is our **club deal** of **entrepreneurs and intrapreneurs** who back the growth of our startups and scaleups with **meaningful money**: besides their funds, also their skills and relationships in the specific sectors of our portfolio companies and in the functional areas that matter most for their growth.',
        'The club is also open to the entrepreneurs who are clients of our other business units, who can invest jointly or separately from the funds we advise, supporting the startups of our Tribe and helping develop the services of our Lab.',
      ],
    ),
    stat: { value: '300+', label: l('entrepreneur e intrapreneur', 'entrepreneurs and intrapreneurs') },
  },
];
