/**
 * Content governance (PRD §43, §53).
 * Every fact is VERIFIED, TO_VERIFY or PLACEHOLDER. Never invent content:
 * use one of the placeholder strings below instead.
 */
export type ContentStatus = 'VERIFIED' | 'TO_VERIFY' | 'PLACEHOLDER';

export const PH = {
  content: '[PLACEHOLDER — CONTENT REQUIRED]',
  statistic: '[STATISTIC TO VERIFY]',
  link: '[LINK TO BE PROVIDED]',
  whatsapp: '[WHATSAPP COMMUNITY LINK TO BE PROVIDED]',
  testimonial: '[TESTIMONIAL PLACEHOLDER]',
  provided: '[CONTENT TO BE PROVIDED]',
} as const;

const PLACEHOLDER_RE = /\[(PLACEHOLDER — CONTENT REQUIRED|STATISTIC TO VERIFY|LINK TO BE PROVIDED|WHATSAPP COMMUNITY LINK TO BE PROVIDED|TESTIMONIAL PLACEHOLDER|CONTENT TO BE PROVIDED|STATISTIC TO BE VERIFIED)\]/;

export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || PLACEHOLDER_RE.test(value);
}

/** A value with its provenance, so reviewers can see where every fact comes from. */
export interface Fact<T> {
  value: T;
  status: ContentStatus;
  source?: string;
  note?: string;
}

export const fact = <T,>(value: T, status: ContentStatus, source?: string, note?: string): Fact<T> => ({
  value,
  status,
  source,
  note,
});

/** True only for facts that may be published as-is. */
export const publishable = <T,>(f: Fact<T>) => f.status === 'VERIFIED' && !(typeof f.value === 'string' && isPlaceholder(f.value));
