import { guard, json, readJson } from '@/lib/api/guard';
import { anonConfig } from '@/lib/review/auth';
import { clearSessionCookies, getSession, respond } from '@/lib/review/session';
import { createAnnotation, createAnnotationSchema, httpStatus, listAnnotations, pagePath } from '@/lib/review/annotations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = { max: 120, windowMs: 10 * 60 * 1000 };

/**
 * Internal annotations (PRD §14). Every call runs as the signed-in user: Supabase verifies the JWT and
 * RLS decides (team members only). Without a session → 401 before anything is requested upstream.
 */
export async function GET(req: Request) {
  const blocked = guard(req, 'annotations', LIMIT);
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const session = await getSession(req);
  if (!session) return respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies());
  const page = pagePath.safeParse(new URL(req.url).searchParams.get('page'));
  if (!page.success) return respond({ ok: false, error: 'validation' }, 422, session.setCookies);
  const r = await listAnnotations(session.accessToken, page.data);
  if (!r.ok) return respond({ ok: false, error: r.error }, httpStatus[r.error], r.error === 'unauthenticated' ? clearSessionCookies() : session.setCookies);
  return respond({ ok: true, items: r.items }, 200, session.setCookies);
}

export async function POST(req: Request) {
  const blocked = guard(req, 'annotations', LIMIT);
  if (blocked) return blocked;
  if (!anonConfig()) return json({ ok: false, error: 'not_configured' }, 503);
  const session = await getSession(req);
  if (!session) return respond({ ok: false, error: 'unauthenticated' }, 401, clearSessionCookies());
  const read = await readJson(req, 8 * 1024);
  if (!read.ok) return read.response;
  const parsed = createAnnotationSchema.safeParse(read.body);
  if (!parsed.success) return respond({ ok: false, error: 'validation' }, 422, session.setCookies);
  const r = await createAnnotation(session.accessToken, parsed.data);
  if (!r.ok) return respond({ ok: false, error: r.error }, httpStatus[r.error], r.error === 'unauthenticated' ? clearSessionCookies() : session.setCookies);
  return respond({ ok: true, item: r.item }, 201, session.setCookies);
}
