/**
 * Join the Tribe uploads (PRD §10.4): PDF only, max 4 MB, sent through the API route.
 * Shared by the form (instant feedback) and the server (authoritative check).
 * Keep in sync with supabase/migrations/0004_storage_join_documents.sql (bucket limits).
 */
export const JOIN_BUCKET = 'join-documents';

/** Hard ceiling: request bodies above ~4.5 MB never reach a Vercel function. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_UPLOAD = 'application/pdf,.pdf';

/** Configurable below the ceiling with JOIN_UPLOAD_MAX_MB (server only). */
export function maxUploadBytes(): number {
  const mb = Number(process.env.JOIN_UPLOAD_MAX_MB);
  return Number.isFinite(mb) && mb > 0 ? Math.min(Math.round(mb * 1024 * 1024), MAX_UPLOAD_BYTES) : MAX_UPLOAD_BYTES;
}

export type UploadError = 'fileType' | 'fileTooLarge';

/** Quick checks on name, declared type and size (what the browser knows before sending). */
export function checkUploadMeta(file: { name: string; type: string; size: number }, max = MAX_UPLOAD_BYTES): UploadError | null {
  if (file.size <= 0) return 'fileType';
  if (file.size > max) return 'fileTooLarge';
  const pdfName = /\.pdf$/i.test(file.name);
  const pdfType = file.type === 'application/pdf' || file.type === '';
  return pdfName && pdfType ? null : 'fileType';
}

/** Content check: a real PDF starts with "%PDF-" — renamed executables or images are rejected. */
export function isPdfSignature(bytes: Uint8Array): boolean {
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  return bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b);
}

/** Original name kept only as a label for the team: ASCII letters, digits, dot, dash, underscore. */
export function safeFileName(name: string): string {
  const base = name.normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^[._]+/, '');
  return (base || 'file.pdf').slice(0, 120);
}

/** Unpredictable storage path, never derived from user input: pitch|cv/YYYY/MM/<uuid>.pdf */
export function storagePath(kind: 'pitch' | 'cv', uuid: string, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${kind}/${y}/${m}/${uuid}.pdf`;
}
