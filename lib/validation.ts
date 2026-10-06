import { z } from 'zod';
import { locales } from '@/content/types';
import { CHALLENGES, COMPANY_STAGES, INTENTS, INTERESTS, SOURCES, UTM_KEYS } from './options';

/**
 * Shared lead schema — used by the form (client-side) and the API route (server-side).
 * Error messages are stable codes, translated in the UI via dictionary.form.errors.
 */
export type ErrorCode = 'required' | 'email' | 'url' | 'linkedin' | 'consent' | 'tooLong';

const required = (max: number) =>
  z
    .string({ required_error: 'required', invalid_type_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(max, 'tooLong');

/** Accepts "azienda.it" and normalises it to "https://azienda.it". Empty → undefined. */
const optionalUrl = (code: ErrorCode, check?: (url: URL) => boolean) =>
  z
    .string()
    .trim()
    .max(300, 'tooLong')
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      try {
        const url = new URL(withProtocol);
        if (!url.hostname.includes('.') || (check && !check(url))) throw new Error('invalid');
        return url.toString();
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: code });
        return z.NEVER;
      }
    });

export const leadSchema = z
  .object({
    intent: z.enum(INTENTS),
    locale: z.enum(locales),
    firstName: required(80),
    lastName: required(80),
    email: z
      .string({ required_error: 'required' })
      .trim()
      .toLowerCase()
      .min(1, 'required')
      .max(254, 'tooLong')
      .email('email'),
    company: required(120),
    role: required(120),
    companyStage: z.enum(COMPANY_STAGES, { errorMap: () => ({ message: 'required' }) }),
    website: optionalUrl('url'),
    linkedin: optionalUrl('linkedin', (url) => /(^|\.)linkedin\.com$/i.test(url.hostname)),
    challenges: z.array(z.enum(CHALLENGES)).max(CHALLENGES.length).default([]),
    interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length).default([]),
    source: z
      .union([z.enum(SOURCES), z.literal('')])
      .optional()
      .transform((v) => (v ? v : undefined)),
    message: z
      .string()
      .trim()
      .max(2000, 'tooLong')
      .optional()
      .transform((v) => (v ? v : undefined)),
    consent: z.literal(true, { errorMap: () => ({ message: 'consent' }) }),
    utm: z.record(z.enum(UTM_KEYS), z.string().max(200)).optional(),
    // Anti-spam signals (never stored)
    company_website_hp: z.string().max(0).optional(),
    elapsedMs: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.intent === 'contact' && !data.message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['message'], message: 'required' });
    }
  });

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Flattens zod issues into { field: code } (first issue per field). */
export function toFieldErrors(error: z.ZodError): Record<string, ErrorCode> {
  const out: Record<string, ErrorCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = (issue.message as ErrorCode) || 'required';
  }
  return out;
}
