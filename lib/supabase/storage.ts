import 'server-only';
import { JOIN_BUCKET } from '@/lib/uploads';
import { authHeaders, supabaseConfig } from './rest';

export type UploadResult = { ok: true } | { ok: false; reason: 'error' | 'not_configured' };

/**
 * Uploads to the PRIVATE join-documents bucket with the service key (server only).
 * No public URL exists for these objects; the team opens them from the Supabase dashboard.
 */
export async function uploadJoinDocument(path: string, bytes: Uint8Array): Promise<UploadResult> {
  const cfg = supabaseConfig('service');
  if (!cfg) return { ok: false, reason: 'not_configured' };
  try {
    const res = await fetch(`${cfg.url}/storage/v1/object/${JOIN_BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/pdf', 'x-upsert': 'false', 'Cache-Control': 'no-store' },
      body: bytes as unknown as BodyInit,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[storage] upload failed', res.status); // no file name or personal data in logs
      return { ok: false, reason: 'error' };
    }
    return { ok: true };
  } catch {
    console.error('[storage] upload network error');
    return { ok: false, reason: 'error' };
  }
}

/** Best-effort removal, used when the database insert fails after an upload (no orphan files). */
export async function deleteJoinDocument(path: string): Promise<boolean> {
  const cfg = supabaseConfig('service');
  if (!cfg) return false;
  try {
    const res = await fetch(`${cfg.url}/storage/v1/object/${JOIN_BUCKET}`, {
      method: 'DELETE',
      headers: { ...authHeaders(cfg.key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: [path] }),
      cache: 'no-store',
    });
    if (!res.ok) console.error('[storage] cleanup failed', res.status);
    return res.ok;
  } catch {
    console.error('[storage] cleanup network error');
    return false;
  }
}
