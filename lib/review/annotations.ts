import 'server-only';
import { z } from 'zod';
import { asUser } from './auth';

/** Stable anchors only: section ids from the page (e.g. "founder") and generated tag:nth-of-type paths. */
const sectionId = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,79}$/);
const selector = z.string().max(300).regex(/^[a-z0-9]+:nth-of-type\(\d{1,3}\)( > [a-z0-9]+:nth-of-type\(\d{1,3}\)){0,7}$/);
export const pagePath = z.string().max(200).regex(/^\/(it|en)(\/[a-z0-9/_-]*)?$/);

export const createAnnotationSchema = z.object({
  pagePath,
  locale: z.enum(['it', 'en']),
  sectionId: sectionId.nullable().optional(),
  elementSelector: selector.nullable().optional(),
  anchor: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), vw: z.number().int().min(200).max(8000).optional() }),
  comment: z.string().trim().min(1).max(2000),
});

export const updateAnnotationSchema = z
  .object({
    comment: z.string().trim().min(1).max(2000).optional(),
    status: z.enum(['open', 'resolved', 'archived']).optional(),
  })
  .refine((v) => v.comment !== undefined || v.status !== undefined, { message: 'empty' });

export const annotationId = z.string().uuid();

const COLUMNS = 'id,page_path,locale,section_id,element_selector,anchor_data,comment,status,author_id,author_email,resolved_by,resolved_at,created_at,updated_at';

export type StoreError = 'unauthenticated' | 'forbidden' | 'not_found' | 'validation' | 'not_configured' | 'error';

/** Maps PostgREST answers (as the signed-in user) to a small, stable set of errors. */
function mapError(status: number, data: unknown): StoreError {
  const code = (data as { code?: string } | null)?.code;
  if (status === 0) return 'not_configured';
  if (status === 401 || code === 'PGRST301' || code === 'PGRST303') return 'unauthenticated';
  if (status === 403 || code === '42501') return 'forbidden';
  if (status === 400 || code === '23514' || code === '22P02') return 'validation';
  return 'error';
}

export async function listAnnotations(token: string, path: string) {
  const r = await asUser(token, `/site_annotations?select=${COLUMNS}&page_path=eq.${encodeURIComponent(path)}&order=created_at.asc`);
  return r.ok ? { ok: true as const, items: (r.data as unknown[]) ?? [] } : { ok: false as const, error: mapError(r.status, r.data) };
}

export async function createAnnotation(token: string, a: z.output<typeof createAnnotationSchema>) {
  // author_id / author_email / status are NOT sent: the database trigger takes them from the JWT
  const r = await asUser(token, `/site_annotations?select=${COLUMNS}`, {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      page_path: a.pagePath,
      locale: a.locale,
      section_id: a.sectionId ?? null,
      element_selector: a.elementSelector ?? null,
      anchor_data: a.anchor,
      comment: a.comment,
    },
  });
  if (!r.ok) return { ok: false as const, error: mapError(r.status, r.data) };
  const row = Array.isArray(r.data) ? r.data[0] : null;
  return row ? { ok: true as const, item: row } : { ok: false as const, error: 'forbidden' as const };
}

export async function updateAnnotation(token: string, id: string, patch: z.output<typeof updateAnnotationSchema>) {
  const r = await asUser(token, `/site_annotations?id=eq.${id}&select=${COLUMNS}`, { method: 'PATCH', prefer: 'return=representation', body: patch });
  if (!r.ok) return { ok: false as const, error: mapError(r.status, r.data) };
  const row = Array.isArray(r.data) ? r.data[0] : null;
  // No row back: it doesn't exist or RLS hides it from this user
  return row ? { ok: true as const, item: row } : { ok: false as const, error: 'not_found' as const };
}

export async function deleteAnnotation(token: string, id: string) {
  const r = await asUser(token, `/site_annotations?id=eq.${id}&select=id`, { method: 'DELETE', prefer: 'return=representation' });
  if (!r.ok) return { ok: false as const, error: mapError(r.status, r.data) };
  const deleted = Array.isArray(r.data) && r.data.length > 0;
  // Editors are not allowed to delete: RLS filters the row out, so nothing is deleted
  return deleted ? { ok: true as const } : { ok: false as const, error: 'forbidden' as const };
}

export const httpStatus: Record<StoreError, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  not_configured: 503,
  error: 500,
};
