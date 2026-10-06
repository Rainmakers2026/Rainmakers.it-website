import { z } from 'zod';
import { locales } from '@/content/types';
import { PROFILE_TYPES, UTM_KEYS } from './options';

/**
 * Shared lead schema (PRD §18–19) — used by the form (client) and the API route (server).
 * Error messages are stable codes, translated via connect.form.errors.
 */
export type ErrorCode = 'required' | 'email' | 'url' | 'consent' | 'tooLong';

const required = (max: number) =>
  z
    .string({ required_error: 'required', invalid_type_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(max, 'tooLong');

/** Website or LinkedIn URL. Accepts "azienda.it" and normalises to "https://azienda.it/". Empty → undefined. */
const optionalUrl = z
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

export const leadSchema = z.object({
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
  link: optionalUrl,
  profileType: z.enum(PROFILE_TYPES, { errorMap: () => ({ message: 'required' }) }),
  interest: z
    .string()
    .trim()
    .max(1000, 'tooLong')
    .optional()
    .transform((v) => (v ? v : undefined)),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent' }) }),
  utm: z.record(z.enum(UTM_KEYS), z.string().max(200)).optional(),
  // Anti-spam signals (never stored)
  company_website_hp: z.string().max(0).optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
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
