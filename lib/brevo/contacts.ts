import 'server-only';
import { brevoConfig, brevoPost, type BrevoFailure } from './client';

export type SyncResult = { ok: true } | { ok: false; reason: BrevoFailure | 'no_list' };

/**
 * Adds a CONFIRMED newsletter subscriber to the Brevo list "Contatti" (BREVO_CONTACTS_LIST_ID).
 * Called only after double opt-in. Idempotent: updateEnabled makes an existing contact an update,
 * and Brevo's "duplicate_parameter" answer is treated as success.
 */
export async function addToContactsList(email: string): Promise<SyncResult> {
  const cfg = brevoConfig();
  if (!cfg) return { ok: false, reason: 'not_configured' };
  if (!cfg.contactsListId) return { ok: false, reason: 'no_list' };
  const res = await brevoPost('/contacts', { email, listIds: [cfg.contactsListId], updateEnabled: true }, cfg);
  if (res.ok || (!res.ok && res.code === 'duplicate_parameter')) return { ok: true };
  return { ok: false, reason: res.reason };
}
