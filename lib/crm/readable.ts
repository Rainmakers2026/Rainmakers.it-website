import type { CrmForm } from './schema';
import { FORMS } from './forms';
import {
  AMOUNT_LABELS,
  AREA_LABELS,
  AVAILABILITY_LABELS,
  COLLABORATION_LABELS,
  COMPANY_SIZE_LABELS,
  CONTRIBUTION_LABELS,
  EXPERIENCE_LABELS,
  FUNDING_STATUS_LABELS,
  GEOGRAPHY_LABELS,
  INDUSTRY_LABELS,
  INNOVATION_OBJECTIVE_LABELS,
  JOB_AREA_LABELS,
  PLAYER_TYPE_LABELS,
  PRIMARY_NEED_LABELS,
  SERVICE_LABELS,
  STAGE_LABELS,
  labelOf,
} from './taxonomy';

type L = Record<string, { it: string; en: string }>;
const one = (labels: L, v: string | undefined) => labelOf(labels, v, 'it');
const many = (labels: L, v: string[] | undefined) => (v ?? []).map((x) => labelOf(labels, x, 'it')).join(', ');

/**
 * A request as readable rows for the team email (Italian labels, internal). Empty answers are left out;
 * `message` is shown apart, as a quote.
 */
export function readableFields(v: CrmForm): Record<string, string> {
  let country = v.country ?? '';
  try {
    country = v.country ? (new Intl.DisplayNames(['it'], { type: 'region' }).of(v.country) ?? v.country) : '';
  } catch {
    // keep the ISO code
  }
  const rows: Record<string, string> = {
    Nome: v.firstName,
    Cognome: v.lastName,
    Email: v.email,
    Telefono: v.phone ?? '',
    Ruolo: v.jobTitle ?? '',
    Organizzazione: v.organizationName ?? '',
    'Sito web': v.organizationWebsite ?? '',
    'Tipo di player': one(PLAYER_TYPE_LABELS, v.playerType),
    Settore: one(INDUSTRY_LABELS, v.industry),
    Paese: country,
    Città: v.city ?? '',
    Area: FORMS[v.form].area ? one(AREA_LABELS, FORMS[v.form].area ?? undefined) : '',
    'Fase della startup': one(STAGE_LABELS, v.startupStage),
    'Stato del fundraising': one(FUNDING_STATUS_LABELS, v.fundingStatus),
    'Importo cercato': one(AMOUNT_LABELS, v.fundingRange),
    'Bisogno principale': one(PRIMARY_NEED_LABELS, v.primaryNeed),
    'Ticket di investimento': one(AMOUNT_LABELS, v.investmentTicket),
    'Fasi di investimento': many(STAGE_LABELS, v.investmentStages),
    'Settori di investimento': many(INDUSTRY_LABELS, v.investmentIndustries),
    'Aree geografiche': many(GEOGRAPHY_LABELS, v.investmentGeographies),
    'Fasi supportate': many(STAGE_LABELS, v.supportedStages),
    'Settori supportati': many(INDUSTRY_LABELS, v.supportedIndustries),
    'Servizi offerti': many(SERVICE_LABELS, v.servicesOffered),
    'Dimensione azienda': one(COMPANY_SIZE_LABELS, v.companySize),
    'Obiettivo di innovazione': one(INNOVATION_OBJECTIVE_LABELS, v.innovationObjective),
    'Collaborazioni di interesse': many(COLLABORATION_LABELS, v.collaborationInterest),
    Contributo: one(CONTRIBUTION_LABELS, v.contribution),
    Disponibilità: one(AVAILABILITY_LABELS, v.availability),
    Esperienza: one(EXPERIENCE_LABELS, v.experience),
    'Area di interesse': one(JOB_AREA_LABELS, v.jobArea),
    LinkedIn: v.linkedin ?? '',
    'Link al documento': v.documentLink ?? '',
    'Newsletter richiesta': v.newsletterOptIn ? 'Sì (in attesa di conferma via email)' : 'No',
    'Interessi editoriali': v.newsletterOptIn ? many(AREA_LABELS, v.editorialInterests) : '',
    Lingua: v.locale.toUpperCase(),
  };
  return Object.fromEntries(Object.entries(rows).filter(([, x]) => x));
}
