import { z } from 'zod';
import { locales } from '@/content/types';
import { UTM_KEYS } from '@/lib/options';
import { FORMS, FORM_KEYS, type FormKey } from './forms';
import {
  AMOUNTS,
  AREAS,
  AVAILABILITIES,
  COLLABORATIONS,
  COMPANY_SIZES,
  CONTRIBUTIONS,
  COUNTRIES,
  EXPERIENCES,
  FUNDING_STATUSES,
  GEOGRAPHIES,
  INDUSTRIES,
  INNOVATION_OBJECTIVES,
  JOB_AREAS,
  PLAYER_TYPES,
  PRIMARY_NEEDS,
  SERVICES,
  STAGES,
  playerGroup,
} from './taxonomy';

/**
 * One schema for every "Come vuoi iniziare?" form (2026-11-11), validated in the browser for instant feedback and
 * again on the server, which is the one that counts. Field names are flat and match the form inputs, so each error
 * code lands on its field. What the form sends for the technical fields (form type, area, privacy version…) is never
 * trusted: the server derives them from the form id (lib/crm/forms.ts).
 */
export type CrmErrorCode = 'required' | 'email' | 'url' | 'consent' | 'tooLong' | 'invalid' | 'fileOrLink' | 'fileType' | 'fileTooLarge';

const req = (max: number) => z.string({ required_error: 'required', invalid_type_error: 'required' }).trim().min(1, 'required').max(max, 'tooLong');
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'tooLong')
    .optional()
    .transform((v) => (v ? v : undefined));
/** Optional select: empty → undefined, otherwise one of the values */
const optEnum = <T extends [string, ...string[]]>(values: T) =>
  z
    .string({ invalid_type_error: 'invalid' })
    .optional()
    .transform((v, ctx) => {
      if (!v) return undefined;
      if (!(values as readonly string[]).includes(v)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid' });
        return z.NEVER;
      }
      return v as T[number];
    });
const multi = <T extends [string, ...string[]]>(values: T, max = values.length) =>
  z
    .array(z.enum(values, { errorMap: () => ({ message: 'invalid' }) }))
    .max(max, 'invalid')
    .optional()
    .transform((v) => (v?.length ? [...new Set(v)] : []));

export const email = z
  .string({ required_error: 'required' })
  .trim()
  .toLowerCase()
  .min(1, 'required')
  .max(254, 'tooLong')
  .email('email');

/** "azienda.it" → "https://azienda.it/"; empty → undefined */
export const optionalUrl = z
  .string()
  .trim()
  .max(300, 'tooLong')
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withProtocol);
      if (!url.hostname.includes('.')) throw new Error('invalid');
      return url.toString();
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'url' });
      return z.NEVER;
    }
  });

const phone = z
  .string()
  .trim()
  .max(40, 'tooLong')
  .regex(/^[+()\d\s.-]*$/, 'invalid')
  .optional()
  .transform((v) => (v ? v : undefined));

const utm = z
  .record(z.enum(UTM_KEYS), z.string().max(200))
  .optional()
  .transform((v) => v ?? {});

/** Path of the page the form was sent from: a site path only, without query string or fragment */
const sourcePage = z
  .string()
  .max(300)
  .optional()
  .transform((v) => {
    const path = (v ?? '').split(/[?#]/)[0];
    return /^\/[A-Za-z0-9/_.-]*$/.test(path) ? path : undefined;
  });

export const crmFormSchema = z
  .object({
    form: z.enum(FORM_KEYS),
    locale: z.enum(locales),
    idempotencyKey: z.string({ required_error: 'required' }).uuid('required'),
    sourcePage,
    utm,
    // common
    firstName: req(80),
    lastName: req(80),
    email,
    phone,
    jobTitle: opt(120),
    organizationName: opt(150),
    organizationWebsite: optionalUrl,
    playerType: optEnum(PLAYER_TYPES),
    industry: optEnum(INDUSTRIES),
    country: optEnum(COUNTRIES),
    city: opt(120),
    message: opt(2000),
    // startup
    startupStage: optEnum(STAGES),
    fundingStatus: optEnum(FUNDING_STATUSES),
    fundingRange: optEnum(AMOUNTS),
    primaryNeed: optEnum(PRIMARY_NEEDS),
    // investor
    investmentTicket: optEnum(AMOUNTS),
    investmentStages: multi(STAGES),
    investmentIndustries: multi(INDUSTRIES),
    investmentGeographies: multi(GEOGRAPHIES),
    // accelerator / incubator
    supportedStages: multi(STAGES),
    supportedIndustries: multi(INDUSTRIES),
    servicesOffered: multi(SERVICES),
    // corporate / SME (company form)
    companySize: optEnum(COMPANY_SIZES),
    innovationObjective: optEnum(INNOVATION_OBJECTIVES),
    collaborationInterest: multi(COLLABORATIONS),
    // giveback
    contribution: optEnum(CONTRIBUTIONS),
    availability: optEnum(AVAILABILITIES),
    // job application
    experience: optEnum(EXPERIENCES),
    jobArea: optEnum(JOB_AREAS),
    linkedin: optionalUrl,
    // pitch deck or CV link (the PDF travels as a file)
    documentLink: optionalUrl,
    // consents: the privacy notice for this request, and the newsletter — separate, optional, never preselected
    privacy: z.literal(true, { errorMap: () => ({ message: 'consent' }) }),
    newsletterOptIn: z.boolean().optional().default(false),
    editorialInterests: multi(AREAS),
    // anti-spam (never stored)
    company_website_hp: z.string().max(0).optional(),
    elapsedMs: z.number().int().nonnegative().optional(),
  })
  .superRefine((v, ctx) => {
    const def = FORMS[v.form];
    const need = (ok: unknown, field: string, message: CrmErrorCode = 'required') => {
      if (!ok || (Array.isArray(ok) && !ok.length)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    };
    if (def.player) {
      need(v.industry, 'industry');
      if (def.organizationRequired) {
        need(v.organizationName, 'organizationName');
        need(v.playerType, 'playerType');
      }
      if (v.playerType && def.playerTypes && !def.playerTypes.includes(v.playerType)) need(false, 'playerType', 'invalid');
      // at most one required qualification field per player group
      const group = playerGroup(v.playerType);
      if (group === 'startup') need(v.startupStage, 'startupStage');
      if (group === 'investor') need(v.investmentTicket, 'investmentTicket');
      if (group === 'accelerator') need(v.supportedStages, 'supportedStages');
      if (def.corporateBlock) need(v.innovationObjective, 'innovationObjective');
      if (v.form === 'giveback') need(v.contribution, 'contribution');
    } else {
      need(v.experience, 'experience');
      need(v.jobArea, 'jobArea');
    }
  });

export type CrmFormInput = z.input<typeof crmFormSchema>;
export type CrmForm = z.output<typeof crmFormSchema>;

/** Form-specific answers stored in form_submissions.data: only the block that applies, snake_case keys. */
export function submissionData(v: CrmForm): Record<string, string | string[]> {
  const def = FORMS[v.form];
  const out: Record<string, string | string[] | undefined> = {};
  const group = def.player ? playerGroup(v.playerType) : null;
  if (group === 'startup') Object.assign(out, { startup_stage: v.startupStage, funding_status: v.fundingStatus, funding_range: v.fundingRange, primary_need: v.primaryNeed });
  if (group === 'investor')
    Object.assign(out, {
      investment_ticket: v.investmentTicket,
      investment_stages: v.investmentStages,
      investment_industries: v.investmentIndustries,
      investment_geographies: v.investmentGeographies,
    });
  if (group === 'accelerator') Object.assign(out, { supported_stages: v.supportedStages, supported_industries: v.supportedIndustries, services_offered: v.servicesOffered });
  if (def.corporateBlock) Object.assign(out, { company_size: v.companySize, innovation_objective: v.innovationObjective, collaboration_interest: v.collaborationInterest });
  if (v.form === 'giveback') Object.assign(out, { contribution: v.contribution, availability: v.availability, linkedin: v.linkedin });
  if (v.form === 'job') Object.assign(out, { experience: v.experience, job_area: v.jobArea, linkedin: v.linkedin, city: v.city });
  return Object.fromEntries(Object.entries(out).filter(([, x]) => x !== undefined && !(Array.isArray(x) && !x.length))) as Record<string, string | string[]>;
}

/** Newsletter "Gocce di Innovazione" (dedicated form): email, optional name and editorial interests, explicit consent. */
export const gdiNewsletterSchema = z.object({
  email,
  firstName: opt(80),
  interests: multi(AREAS),
  locale: z.enum(locales),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent' }) }),
  source: z.enum(['footer', 'final', 'news', 'popup']).optional(),
  sourcePage,
  utm,
  website: z.string().max(0).optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
});
export type GdiNewsletter = z.output<typeof gdiNewsletterSchema>;

/** { field: code }, first issue per field */
export function crmFieldErrors(error: z.ZodError): Record<string, CrmErrorCode> {
  const out: Record<string, CrmErrorCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = (issue.message as CrmErrorCode) || 'invalid';
  }
  return out;
}

export const isFormKey = (v: unknown): v is FormKey => typeof v === 'string' && (FORM_KEYS as string[]).includes(v);
