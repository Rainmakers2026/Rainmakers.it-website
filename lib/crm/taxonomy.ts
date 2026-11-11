/**
 * CRM vocabulary (2026-11-11): the stable values stored in Supabase (supabase/migrations/0010_crm.sql checks the same
 * lists) and projected to Brevo and Airtable, with their Italian and English labels. Values never change once used;
 * labels can. Shared by the forms (client) and the API routes (server).
 */
import type { Locale } from '@/content/types';

type Labels<K extends string> = Record<K, { it: string; en: string }>;
const keys = <K extends string>(labels: Labels<K>) => Object.keys(labels) as [K, ...K[]];

/** The three Rainmakers areas, also the three editorial sections of "Gocce di Innovazione". */
export const AREA_LABELS = {
  giveback: { it: 'Giveback', en: 'Giveback' },
  open_venture_building: { it: 'Open Venture Building', en: 'Open Venture Building' },
  advisory: { it: 'Advisory', en: 'Advisory' },
} satisfies Labels<string>;
export const AREAS = keys(AREA_LABELS);
export type Area = (typeof AREAS)[number];

/** Player types (team brief, 2026-11-11): one per contact, the latest one declared. */
export const PLAYER_TYPE_LABELS = {
  startup: { it: 'Startup', en: 'Startup' },
  venture_builder: { it: 'Venture builder / startup studio', en: 'Venture builder / startup studio' },
  vc: { it: 'Fondo di venture capital (VC)', en: 'Venture capital fund (VC)' },
  cvc: { it: 'Corporate venture capital (CVC)', en: 'Corporate venture capital (CVC)' },
  crowdfunding_platform: { it: 'Piattaforma di crowdfunding', en: 'Crowdfunding platform' },
  family_office: { it: 'Family office', en: 'Family office' },
  incubator_accelerator: { it: 'Incubatore / acceleratore', en: 'Incubator / accelerator' },
  institution: { it: 'Istituzione', en: 'Institution' },
  media: { it: 'Media', en: 'Media' },
  empowerment_program: { it: 'Programma di empowerment', en: 'Empowerment programme' },
  training_provider: { it: 'Corsi di formazione', en: 'Training provider' },
  association: { it: 'Associazione', en: 'Association' },
  pst: { it: 'Parco scientifico e tecnologico (PST)', en: 'Science and technology park' },
  ban_club_deal: { it: 'Business angel network / club deal', en: 'Business angel network / club deal' },
  coworking: { it: 'Coworking', en: 'Coworking' },
} satisfies Labels<string>;
export const PLAYER_TYPES = keys(PLAYER_TYPE_LABELS);
export type PlayerType = (typeof PLAYER_TYPES)[number];

/** Which conditional block a player type fills in (none: only the common fields). */
export type PlayerGroup = 'startup' | 'investor' | 'accelerator' | null;
export function playerGroup(type: PlayerType | null | undefined): PlayerGroup {
  if (type === 'startup') return 'startup';
  if (type === 'vc' || type === 'cvc' || type === 'family_office' || type === 'crowdfunding_platform' || type === 'ban_club_deal') return 'investor';
  if (type === 'incubator_accelerator' || type === 'venture_builder') return 'accelerator';
  return null;
}

/**
 * Industries: the categories of the Rainmakers presentation (2026-11-11), plus five general ones so that investors,
 * institutions and media also find theirs.
 */
export const INDUSTRY_LABELS = {
  agrifood: { it: 'Agrifood', en: 'Agrifood' },
  fashion_design: { it: 'Fashion & Design', en: 'Fashion & Design' },
  nanotech: { it: 'Nanotecnologie', en: 'Nanotechnology' },
  robotics: { it: 'Robotica', en: 'Robotics' },
  mechanics: { it: 'Meccanica', en: 'Mechanics' },
  tourism: { it: 'Turismo', en: 'Tourism' },
  industry_5_0: { it: 'Industria 5.0', en: 'Industry 5.0' },
  cloud: { it: 'Sistemi Cloud', en: 'Cloud systems' },
  mobile_apps: { it: 'Mobile Apps', en: 'Mobile apps' },
  b2b_services: { it: 'B2B Services & Platform', en: 'B2B services & platforms' },
  hardware: { it: 'Hardware', en: 'Hardware' },
  fintech: { it: 'Fintech', en: 'Fintech' },
  iot: { it: 'IoT', en: 'IoT' },
  renewable_energy: { it: 'Energie rinnovabili', en: 'Renewable energy' },
  energy_efficiency: { it: 'Efficienza energetica', en: 'Energy efficiency' },
  sustainable_mobility: { it: 'Mobilità sostenibile', en: 'Sustainable mobility' },
  waste_management: { it: 'Trattamento dei rifiuti', en: 'Waste treatment' },
  biotech: { it: 'Biotecnologie', en: 'Biotechnology' },
  pharma: { it: 'Farmaceutica', en: 'Pharmaceuticals' },
  medical_devices: { it: 'Dispositivi Medici', en: 'Medical devices' },
  digital_health: { it: 'Digital Health Care', en: 'Digital health care' },
  assistive_tech: { it: 'Tecnologie di assistenza', en: 'Assistive technologies' },
  social_impact: { it: 'Prodotti e servizi a impatto sociale o ambientale', en: 'Products and services with social or environmental impact' },
  financial_services: { it: 'Servizi finanziari e investimenti', en: 'Financial services and investment' },
  education_research: { it: 'Formazione e ricerca', en: 'Education and research' },
  public_sector: { it: 'Pubblica amministrazione', en: 'Public sector' },
  media_communication: { it: 'Media e comunicazione', en: 'Media and communication' },
  other: { it: 'Altro', en: 'Other' },
} satisfies Labels<string>;
export const INDUSTRIES = keys(INDUSTRY_LABELS);
export type Industry = (typeof INDUSTRIES)[number];

export const STAGE_LABELS = {
  idea: { it: 'Idea', en: 'Idea' },
  pre_seed: { it: 'Pre-seed / MVP', en: 'Pre-seed / MVP' },
  seed: { it: 'Seed', en: 'Seed' },
  series_a: { it: 'Series A', en: 'Series A' },
  series_b_plus: { it: 'Series B e oltre', en: 'Series B and beyond' },
} satisfies Labels<string>;
export const STAGES = keys(STAGE_LABELS);

export const FUNDING_STATUS_LABELS = {
  not_raising: { it: 'Non stiamo raccogliendo', en: 'Not raising' },
  raising_now: { it: 'Stiamo raccogliendo ora', en: 'Raising now' },
  raising_12m: { it: 'Raccoglieremo nei prossimi 12 mesi', en: 'Raising in the next 12 months' },
} satisfies Labels<string>;
export const FUNDING_STATUSES = keys(FUNDING_STATUS_LABELS);

/** Amount sought (startups) or ticket (investors). */
export const AMOUNT_LABELS = {
  under_100k: { it: 'Fino a 100.000 €', en: 'Up to €100,000' },
  '100k_500k': { it: '100.000–500.000 €', en: '€100,000–500,000' },
  '500k_2m': { it: '500.000 €–2 milioni', en: '€500,000–2 million' },
  over_2m: { it: 'Oltre 2 milioni €', en: 'Over €2 million' },
  tbd: { it: 'Da definire', en: 'To be defined' },
} satisfies Labels<string>;
export const AMOUNTS = keys(AMOUNT_LABELS);

export const PRIMARY_NEED_LABELS = {
  business_plan: { it: 'Business plan', en: 'Business plan' },
  fundraising: { it: 'Fundraising', en: 'Fundraising' },
  business_development: { it: 'Business development', en: 'Business development' },
  go_to_market: { it: 'Go-to-market e vendite', en: 'Go-to-market and sales' },
  team: { it: 'Team e competenze', en: 'Team and skills' },
  other: { it: 'Altro', en: 'Other' },
} satisfies Labels<string>;
export const PRIMARY_NEEDS = keys(PRIMARY_NEED_LABELS);

export const GEOGRAPHY_LABELS = {
  italy: { it: 'Italia', en: 'Italy' },
  europe: { it: 'Europa', en: 'Europe' },
  north_america: { it: 'Nord America', en: 'North America' },
  latin_america: { it: 'America Latina', en: 'Latin America' },
  mena: { it: 'Medio Oriente e Nord Africa', en: 'Middle East and North Africa' },
  asia_pacific: { it: 'Asia e Pacifico', en: 'Asia Pacific' },
  global: { it: 'Globale', en: 'Global' },
} satisfies Labels<string>;
export const GEOGRAPHIES = keys(GEOGRAPHY_LABELS);

export const SERVICE_LABELS = {
  incubation: { it: 'Incubazione', en: 'Incubation' },
  acceleration: { it: 'Accelerazione', en: 'Acceleration' },
  mentoring: { it: 'Mentorship', en: 'Mentoring' },
  investment: { it: 'Investimento', en: 'Investment' },
  workspace: { it: 'Spazi di lavoro', en: 'Workspace' },
  training: { it: 'Formazione', en: 'Training' },
  corporate_programs: { it: 'Programmi per corporate', en: 'Corporate programmes' },
  venture_building: { it: 'Venture building', en: 'Venture building' },
} satisfies Labels<string>;
export const SERVICES = keys(SERVICE_LABELS);

export const COMPANY_SIZE_LABELS = {
  '1_9': { it: '1–9 persone', en: '1–9 people' },
  '10_49': { it: '10–49 persone', en: '10–49 people' },
  '50_249': { it: '50–249 persone', en: '50–249 people' },
  '250_plus': { it: '250 persone o più', en: '250 people or more' },
} satisfies Labels<string>;
export const COMPANY_SIZES = keys(COMPANY_SIZE_LABELS);

export const INNOVATION_OBJECTIVE_LABELS = {
  open_innovation: { it: 'Open innovation e call for startup', en: 'Open innovation and calls for startups' },
  tech_scouting: { it: 'Scouting tecnologico', en: 'Technology scouting' },
  digital_transformation: { it: 'Trasformazione digitale', en: 'Digital transformation' },
  new_business: { it: 'Nuovi business e prodotti', en: 'New businesses and products' },
  corporate_venturing: { it: 'Corporate venturing e investimenti in startup', en: 'Corporate venturing and startup investment' },
  training: { it: 'Formazione e cultura dell’innovazione', en: 'Innovation training and culture' },
  other: { it: 'Altro', en: 'Other' },
} satisfies Labels<string>;
export const INNOVATION_OBJECTIVES = keys(INNOVATION_OBJECTIVE_LABELS);

export const COLLABORATION_LABELS = {
  startup_partnership: { it: 'Partnership con startup', en: 'Partnerships with startups' },
  investment: { it: 'Investimenti in startup', en: 'Startup investment' },
  venture_building: { it: 'Creare una nuova impresa insieme', en: 'Building a new venture together' },
  advisory: { it: 'Advisory e accompagnamento', en: 'Advisory and support' },
  events: { it: 'Eventi e programmi', en: 'Events and programmes' },
} satisfies Labels<string>;
export const COLLABORATIONS = keys(COLLABORATION_LABELS);

/** Giveback form: how the person wants to help. */
export const CONTRIBUTION_LABELS = {
  mentoring: { it: 'Mentorship ai founder', en: 'Mentoring founders' },
  skills: { it: 'Competenze professionali (marketing, legale, tech…)', en: 'Professional skills (marketing, legal, tech…)' },
  events: { it: 'Eventi e iniziative', en: 'Events and initiatives' },
  rainforest: { it: 'Italian Rainforest (dati e mappatura)', en: 'Italian Rainforest (data and mapping)' },
  other: { it: 'Altro', en: 'Other' },
} satisfies Labels<string>;
export const CONTRIBUTIONS = keys(CONTRIBUTION_LABELS);

export const AVAILABILITY_LABELS = {
  few_hours: { it: 'Qualche ora al mese', en: 'A few hours a month' },
  half_day: { it: 'Mezza giornata al mese', en: 'Half a day a month' },
  day_plus: { it: 'Una giornata al mese o più', en: 'A day a month or more' },
  project: { it: 'Su singoli progetti', en: 'On specific projects' },
} satisfies Labels<string>;
export const AVAILABILITIES = keys(AVAILABILITY_LABELS);

/** "Lavora con noi" (job application, outside the player model). */
export const EXPERIENCE_LABELS = {
  '0_2': { it: '0–2 anni', en: '0–2 years' },
  '3_5': { it: '3–5 anni', en: '3–5 years' },
  '6_10': { it: '6–10 anni', en: '6–10 years' },
  '10_plus': { it: 'Oltre 10 anni', en: 'Over 10 years' },
} satisfies Labels<string>;
export const EXPERIENCES = keys(EXPERIENCE_LABELS);
export const JOB_AREA_LABELS = { ...AREA_LABELS, other: { it: 'Altro', en: 'Other' } } satisfies Labels<string>;
export const JOB_AREAS = keys(JOB_AREA_LABELS);

/** ISO 3166-1 alpha-2 codes; names come from the browser / Node (Intl.DisplayNames), in the visitor's language. */
export const COUNTRIES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG ' +
  'CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL ' +
  'GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA ' +
  'LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP ' +
  'NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV ' +
  'SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'
).split(' ') as [string, ...string[]];

/** Countries sorted by name in the given language, Italy first. */
export function countryOptions(locale: Locale): { value: string; label: string }[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    names = null;
  }
  const label = (code: string) => names?.of(code) ?? code;
  const rest = COUNTRIES.filter((c) => c !== 'IT')
    .map((value) => ({ value, label: label(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  return [{ value: 'IT', label: label('IT') }, ...rest];
}

/** Label of a stored value, in the given language (the value itself if unknown). */
export function labelOf(labels: Record<string, { it: string; en: string }>, value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  return labels[value]?.[locale] ?? value;
}
