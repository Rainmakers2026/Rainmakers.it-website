/**
 * The site's forms as the CRM sees them (2026-11-11). The server derives every technical field from the form id it
 * receives — type, area, which player types are allowed, what is required — so nothing the browser sends decides it.
 * Bump a form's version (…_v2) when its fields change meaningfully: old submissions keep the id they were sent with.
 */
import type { Area, PlayerType } from './taxonomy';

export type FormKey = 'company' | 'startup' | 'invest' | 'giveback' | 'job';

export interface FormDefinition {
  id: string;
  type: 'company_request' | 'startup_application' | 'investor_application' | 'giveback_application' | 'job_application';
  /** Rainmakers area the request belongs to (also recorded as a CRM interest of the contact) */
  area: Area | null;
  /** Player forms ask organisation, player type and industry; the job application does not */
  player: boolean;
  /** Organisation and player type required (the Giveback form also welcomes individuals) */
  organizationRequired: boolean;
  /** Player types offered (all when null), and the one preselected */
  playerTypes: PlayerType[] | null;
  defaultPlayerType: PlayerType | null;
  /** Corporate / SME questions, asked by the company form whatever the player type */
  corporateBlock: boolean;
  /** A PDF or a link is required (pitch deck, CV) */
  document: 'pitch' | 'cv' | null;
}

export const FORMS: Record<FormKey, FormDefinition> = {
  company: {
    id: 'rm_company_v1',
    type: 'company_request',
    area: 'advisory',
    player: true,
    organizationRequired: true,
    playerTypes: null,
    defaultPlayerType: null,
    corporateBlock: true,
    document: null,
  },
  startup: {
    id: 'rm_startup_v1',
    type: 'startup_application',
    area: 'open_venture_building',
    player: true,
    organizationRequired: true,
    playerTypes: ['startup', 'venture_builder'],
    defaultPlayerType: 'startup',
    corporateBlock: false,
    document: 'pitch',
  },
  invest: {
    id: 'rm_invest_v1',
    type: 'investor_application',
    area: 'advisory',
    player: true,
    organizationRequired: true,
    playerTypes: ['vc', 'cvc', 'family_office', 'crowdfunding_platform', 'ban_club_deal'],
    defaultPlayerType: null,
    corporateBlock: false,
    document: null,
  },
  giveback: {
    id: 'rm_giveback_v1',
    type: 'giveback_application',
    area: 'giveback',
    player: true,
    organizationRequired: false,
    playerTypes: null,
    defaultPlayerType: null,
    corporateBlock: false,
    document: null,
  },
  job: {
    id: 'rm_job_v1',
    type: 'job_application',
    area: null,
    player: false,
    organizationRequired: false,
    playerTypes: null,
    defaultPlayerType: null,
    corporateBlock: false,
    document: 'cv',
  },
};

export const FORM_KEYS = Object.keys(FORMS) as [FormKey, ...FormKey[]];

/** Newsletter and review forms (not player forms) */
export const NEWSLETTER_FORM = { id: 'rm_newsletter_gdi_v1', type: 'newsletter_signup' } as const;
export const REVIEW_FORM = { id: 'rm_review_v1', type: 'review' } as const;

/** The only newsletter */
export const NEWSLETTER_CODE = 'gocce_di_innovazione';

/** Brand recorded as the source of every submission from this site */
export const SOURCE_BRAND = 'rainmakers';

/** Bump when the privacy notice changes: each consent event records the version shown. */
export const PRIVACY_VERSION = '2026-11-privacy-v3';
