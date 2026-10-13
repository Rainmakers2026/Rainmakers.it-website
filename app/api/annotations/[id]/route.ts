import { guard, json, readJson } from '@/lib/api/guard';
import { anonConfig } from '@/lib/review/auth';
import { clearSessionCookies, getSession, respond } from '@/lib/review/session';
import { annotationId, deleteAnnotation, httpStatus, updateAnnotation, updateAnnotationSchema } from '@/lib/review/annotations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = { max: 120, windowMs: 10 * 60 * 1000 };
type Ctx = { params: Promise<{ id: string }> };

/** Edit text (author or admin) or change status (any team member). Rules enforced by RLS + DB trigger. */
export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = guard(req, 'annotations', LIMIT);
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const session = await getSession(req);
  if (!session) return respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies());
  const id = annotationId.safeParse((await params).id);
  if (!id.success) return respond({ ok: false, error: 'validation' }, 422, session.setCookies);
  const read = await readJson(req, 8 * 1024);
  if (!read.ok) return read.response;
  const parsed = updateAnnotationSchema.safeParse(read.body);
  if (!parsed.success) return respond({ ok: false, error: 'validation' }, 422, session.setCookies);
  const r = await updateAnnotation(session.accessToken, id.data, parsed.data);
  if (!r.ok) return respond({ ok: false, error: r.error }, httpStatus[r.error], r.error === 'unauthenticated' ? clearSessionCookies() : session.setCookies);
  return respond({ ok: true, item: r.item }, 200, session.setCookies);
}

/** Delete: admins only (RLS). Editors resolve or archive instead. */
export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = guard(req, 'annotations', LIMIT);
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const session = await getSession(req);
  if (!session) return respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies());
  const id = annotationId.safeParse((await params).id);
  if (!id.success) return respond({ ok: false, error: 'validation' }, 422, session.setCookies);
  const r = await deleteAnnotation(session.accessToken, id.data);
  if (!r.ok) return respond({ ok: false, error: r.error }, httpStatus[r.error], r.error === 'unauthenticated' ? clearSessionCookies() : session.setCookies);
  return respond({ ok: true }, 200, session.setCookies);
}
