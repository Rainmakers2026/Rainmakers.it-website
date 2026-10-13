/**
 * Access-control tests for the internal annotation tool (Phase 6), without network or credentials:
 * real route handlers against stubbed Supabase Auth (GoTrue) and PostgREST.
 * Database policies themselves are tested by supabase/tests/0006_annotations_rls.sql (needs a live DB).
 * Run: npm run test:annotations
 */
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://project.supabase.test';
process.env.SUPABASE_ANON_KEY = 'sb_publishable_test_only';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_must_never_be_used_here';

type Call = { url: string; method: string; headers: Record<string, string>; body: Record<string, unknown> | null };
let calls: Call[] = [];
type R = () => Response;
let routes: Record<string, R> = {};
const ok = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === 'string' && init.body ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  const method = init?.method ?? 'GET';
  calls.push({ url, method, headers: (init?.headers ?? {}) as Record<string, string>, body });
  const key = `${method} ${url.replace('https://project.supabase.test', '').split('?')[0]}`;
  const r = routes[key];
  if (!r) throw new Error(`unexpected fetch ${key}`);
  return r();
}) as typeof fetch;
console.error = () => {};

const MEMBER_AT = 'user-jwt-member';
const tokens = (at = MEMBER_AT) => ({ access_token: at, refresh_token: 'rt-1', expires_in: 3600, user: { id: 'u1', email: 'team@example.com' } });
const future = () => String(Math.floor(Date.now() / 1000) + 3000);
const sessionCookie = (at = MEMBER_AT, exp = future()) => `rm_rev_at=${at}; rm_rev_rt=rt-1; rm_rev_exp=${exp}`;

let ip = 0;
const req = (path: string, init: { method?: string; body?: unknown; cookie?: string; origin?: string } = {}) =>
  new Request(`http://localhost${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'x-real-ip': `10.2.0.${++ip}`,
      'Content-Type': 'application/json',
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...(init.origin ? { origin: init.origin } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
const upstream = () => calls.length;
const note = { pagePath: '/it', locale: 'it', sectionId: 'founder', elementSelector: 'div:nth-of-type(1) > h2:nth-of-type(1)', anchor: { x: 0.2, y: 0.5, vw: 1440 }, comment: 'Accorciare il titolo' };
const ID = '9b2f4c1e-8d3a-4f6b-9c2d-1e0f3a4b5c6d';

let n = 0;
async function test(name: string, fn: () => Promise<void>) {
  calls = [];
  routes = {};
  await fn();
  n++;
  process.stdout.write(`✓ ${name}\n`);
}

async function main() {
  const annotations = await import('../app/api/annotations/route');
  const one = await import('../app/api/annotations/[id]/route');
  const session = await import('../app/api/review/session/route');
  const start = await import('../app/api/review/session/start/route');
  const verify = await import('../app/api/review/session/verify/route');
  const params = { params: Promise.resolve({ id: ID }) };

  // ── Anonymous visitors ──
  await test('anonymous: list → 401, nothing requested from Supabase', async () => {
    const r = await annotations.GET(req('/api/annotations?page=/it'));
    assert.equal(r.status, 401);
    assert.equal(upstream(), 0);
  });
  await test('anonymous: create / edit / delete → 401, nothing requested', async () => {
    assert.equal((await annotations.POST(req('/api/annotations', { method: 'POST', body: note }))).status, 401);
    assert.equal((await one.PATCH(req(`/api/annotations/${ID}`, { method: 'PATCH', body: { status: 'resolved' } }), params)).status, 401);
    assert.equal((await one.DELETE(req(`/api/annotations/${ID}`, { method: 'DELETE' }), params)).status, 401);
    assert.equal(upstream(), 0);
  });
  await test('anonymous: session check → 401', async () => {
    assert.equal((await session.GET(req('/api/review/session'))).status, 401);
  });
  await test('forged access cookie without refresh token → 401', async () => {
    const r = await annotations.GET(req('/api/annotations?page=/it', { cookie: 'rm_rev_at=forged' }));
    assert.equal(r.status, 401);
    assert.equal(upstream(), 0);
  });
  await test('cross-origin request → 403 even with a session', async () => {
    const r = await annotations.GET(req('/api/annotations?page=/it', { cookie: sessionCookie(), origin: 'https://evil.example' }));
    assert.equal(r.status, 403);
    assert.equal(upstream(), 0);
  });

  // ── Sign-in ──
  await test('sign-in start: same answer whether or not the user exists (no enumeration), no sign-ups', async () => {
    routes['POST /auth/v1/otp'] = () => ok({ msg: 'Signups not allowed for otp' }, 422);
    const r1 = await start.POST(req('/api/review/session/start', { method: 'POST', body: { email: 'stranger@example.com' } }));
    routes['POST /auth/v1/otp'] = () => ok({});
    const r2 = await start.POST(req('/api/review/session/start', { method: 'POST', body: { email: 'team@example.com' } }));
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.deepEqual(await r1.json(), await r2.json());
    assert.equal(calls[0].body!.create_user, false);
    assert.equal(calls[0].headers.apikey, 'sb_publishable_test_only');
  });
  await test('sign-in verify: wrong code → 401, no cookie', async () => {
    routes['POST /auth/v1/verify'] = () => ok({ msg: 'Token has expired or is invalid' }, 403);
    const r = await verify.POST(req('/api/review/session/verify', { method: 'POST', body: { email: 'team@example.com', code: '123456' } }));
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('set-cookie'), null);
  });
  await test('sign-in verify: authenticated but NOT a team member → 403, no cookie, session revoked', async () => {
    routes['POST /auth/v1/verify'] = () => ok(tokens('user-jwt-outsider'));
    routes['GET /rest/v1/team_members'] = () => ok([]);
    routes['POST /auth/v1/logout'] = () => new Response(null, { status: 204 });
    const r = await verify.POST(req('/api/review/session/verify', { method: 'POST', body: { email: 'outsider@example.com', code: '123456' } }));
    assert.equal(r.status, 403);
    assert.equal(r.headers.get('set-cookie'), null);
    assert.ok(calls.some((c) => c.url.endsWith('/auth/v1/logout')));
  });
  await test('sign-in verify: team member → httpOnly cookies scoped to /api, no token in the body', async () => {
    routes['POST /auth/v1/verify'] = () => ok(tokens());
    routes['GET /rest/v1/team_members'] = () => ok([{ email: 'team@example.com', role: 'editor' }]);
    const r = await verify.POST(req('/api/review/session/verify', { method: 'POST', body: { email: 'team@example.com', code: '123456' } }));
    assert.equal(r.status, 200);
    const cookies = r.headers.getSetCookie();
    assert.equal(cookies.length, 3);
    for (const c of cookies) {
      assert.match(c, /HttpOnly/);
      assert.match(c, /Secure/);
      assert.match(c, /SameSite=Lax/);
      assert.match(c, /Path=\/api;/);
    }
    const text = await r.text();
    assert.ok(!text.includes(MEMBER_AT) && !text.includes('rt-1'));
    assert.deepEqual(JSON.parse(text), { ok: true, email: 'team@example.com', role: 'editor' });
    // membership checked with the USER token, never the service key
    const tm = calls.find((c) => c.url.includes('/team_members'))!;
    assert.equal(tm.headers.Authorization, `Bearer ${MEMBER_AT}`);
  });

  // ── Authorised team member ──
  await test('member: list runs as the user (user JWT + anon key, never the service key)', async () => {
    routes['GET /rest/v1/site_annotations'] = () => ok([{ id: ID, comment: 'x', status: 'open' }]);
    const r = await annotations.GET(req('/api/annotations?page=/it', { cookie: sessionCookie() }));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).items.length, 1);
    const c = calls[0];
    assert.equal(c.headers.Authorization, `Bearer ${MEMBER_AT}`);
    assert.equal(c.headers.apikey, 'sb_publishable_test_only');
    assert.ok(!JSON.stringify(calls).includes('sb_secret_must_never_be_used_here'));
    assert.ok(c.url.includes('page_path=eq.%2Fit'));
  });
  await test('member: create sends only content fields (author/status come from the DB, not the client)', async () => {
    routes['POST /rest/v1/site_annotations'] = () => ok([{ id: ID, comment: note.comment, status: 'open' }], 201);
    const spoof = { ...note, author_id: 'someone-else', author_email: 'boss@example.com', status: 'resolved' };
    const r = await annotations.POST(req('/api/annotations', { method: 'POST', body: spoof, cookie: sessionCookie() }));
    assert.equal(r.status, 201);
    const sent = calls[0].body!;
    assert.deepEqual(Object.keys(sent).sort(), ['anchor_data', 'comment', 'element_selector', 'locale', 'page_path', 'section_id']);
  });
  await test('member: invalid page path / selector / empty comment → 422, nothing sent', async () => {
    for (const bad of [{ ...note, pagePath: '/fr' }, { ...note, elementSelector: 'div; drop table' }, { ...note, comment: '   ' }, { ...note, anchor: { x: 2, y: 0 } }]) {
      calls = [];
      const r = await annotations.POST(req('/api/annotations', { method: 'POST', body: bad, cookie: sessionCookie() }));
      assert.equal(r.status, 422);
      assert.equal(upstream(), 0);
    }
  });

  // ── Unauthorised writes by signed-in users (decided by RLS / trigger, mapped to clear errors) ──
  await test('outsider with a valid JWT: RLS returns nothing → list empty, writes refused', async () => {
    routes['GET /rest/v1/site_annotations'] = () => ok([]);
    routes['POST /rest/v1/site_annotations'] = () => ok({ code: '42501', message: 'new row violates row-level security policy' }, 403);
    routes['PATCH /rest/v1/site_annotations'] = () => ok([]);
    const cookie = sessionCookie('user-jwt-outsider');
    assert.deepEqual((await (await annotations.GET(req('/api/annotations?page=/it', { cookie }))).json()).items, []);
    assert.equal((await annotations.POST(req('/api/annotations', { method: 'POST', body: note, cookie }))).status, 403);
    assert.equal((await one.PATCH(req(`/api/annotations/${ID}`, { method: 'PATCH', body: { status: 'archived' }, cookie }), params)).status, 404);
  });
  await test('editor editing someone else’s text → 403 (DB trigger only_author_can_edit)', async () => {
    routes['PATCH /rest/v1/site_annotations'] = () => ok({ code: '42501', message: 'only_author_can_edit' }, 403);
    const r = await one.PATCH(req(`/api/annotations/${ID}`, { method: 'PATCH', body: { comment: 'hijack' }, cookie: sessionCookie() }), params);
    assert.equal(r.status, 403);
  });
  await test('editor deleting → refused (RLS deletes nothing) → 403', async () => {
    routes['DELETE /rest/v1/site_annotations'] = () => ok([]);
    const r = await one.DELETE(req(`/api/annotations/${ID}`, { method: 'DELETE', cookie: sessionCookie() }), params);
    assert.equal(r.status, 403);
  });
  await test('admin deleting → 200', async () => {
    routes['DELETE /rest/v1/site_annotations'] = () => ok([{ id: ID }]);
    const r = await one.DELETE(req(`/api/annotations/${ID}`, { method: 'DELETE', cookie: sessionCookie('user-jwt-admin') }), params);
    assert.equal(r.status, 200);
  });
  await test('member: status change → 200; bad id → 422', async () => {
    routes['PATCH /rest/v1/site_annotations'] = () => ok([{ id: ID, status: 'resolved' }]);
    assert.equal((await one.PATCH(req(`/api/annotations/${ID}`, { method: 'PATCH', body: { status: 'resolved' }, cookie: sessionCookie() }), params)).status, 200);
    calls = [];
    const bad = await one.PATCH(req('/api/annotations/not-a-uuid', { method: 'PATCH', body: { status: 'resolved' }, cookie: sessionCookie() }), { params: Promise.resolve({ id: 'not-a-uuid' }) });
    assert.equal(bad.status, 422);
    assert.equal(upstream(), 0);
  });

  // ── Session lifecycle ──
  await test('expired access token → refreshed, new httpOnly cookies set', async () => {
    routes['POST /auth/v1/token'] = () => ok(tokens('user-jwt-refreshed'));
    routes['GET /rest/v1/site_annotations'] = () => ok([]);
    const r = await annotations.GET(req('/api/annotations?page=/it', { cookie: sessionCookie(MEMBER_AT, '1') }));
    assert.equal(r.status, 200);
    assert.ok(r.headers.getSetCookie().some((c) => c.startsWith('rm_rev_at=user-jwt-refreshed') && c.includes('HttpOnly')));
    assert.equal(calls.find((c) => c.url.includes('/site_annotations'))!.headers.Authorization, 'Bearer user-jwt-refreshed');
  });
  await test('revoked/invalid JWT (PostgREST 401) → 401 and cookies cleared', async () => {
    routes['GET /rest/v1/site_annotations'] = () => ok({ code: 'PGRST301', message: 'JWT expired' }, 401);
    const r = await annotations.GET(req('/api/annotations?page=/it', { cookie: sessionCookie() }));
    assert.equal(r.status, 401);
    assert.ok(r.headers.getSetCookie().every((c) => c.includes('Max-Age=0')));
  });
  await test('member removed from the team → session check 403 and cookies cleared', async () => {
    routes['GET /rest/v1/team_members'] = () => ok([]);
    const r = await session.GET(req('/api/review/session', { cookie: sessionCookie() }));
    assert.equal(r.status, 403);
    assert.ok(r.headers.getSetCookie().every((c) => c.includes('Max-Age=0')));
  });

  console.log(`\n${n} annotation access tests passed`);
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
