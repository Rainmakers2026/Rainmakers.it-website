import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Locale } from '@/content/types';

/**
 * Signed unsubscribe link for "Gocce di Innovazione": /{locale}/newsletter/unsubscribe?c=<contact id>&t=<signature>.
 * The signature is an HMAC-SHA256 of the contact id with NEWSLETTER_LINK_SECRET, so the link works for that person
 * only and nothing is stored. Without the secret (local development only) a fixed development key is used; in
 * production no link is produced and unsubscribing is refused until the secret is set.
 */
const DEV_SECRET = 'rainmakers-dev-only-newsletter-link-secret';

function secret(): string | null {
  const configured = process.env.NEWSLETTER_LINK_SECRET;
  if (configured && configured.length >= 32) return configured;
  return process.env.NODE_ENV === 'production' && process.env.LEADS_MOCK !== '1' ? null : DEV_SECRET;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const sign = (key: string, contactId: string) => createHmac('sha256', key).update(`unsubscribe:${contactId}`).digest('base64url');

export function unsubscribeUrl(baseUrl: string, locale: Locale, contactId: string): string | null {
  const key = secret();
  if (!key || !UUID.test(contactId)) return null;
  return `${baseUrl}/${locale}/newsletter/unsubscribe?c=${contactId}&t=${sign(key, contactId)}`;
}

export function verifyUnsubscribe(contactId: unknown, signature: unknown): contactId is string {
  const key = secret();
  if (!key || typeof contactId !== 'string' || typeof signature !== 'string' || !UUID.test(contactId)) return false;
  const expected = Buffer.from(sign(key, contactId));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
