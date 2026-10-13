/**
 * API route tests for the Supabase-backed forms (Phase 4), without network or credentials:
 * the real route handlers run against a stubbed fetch that plays the Supabase REST/Storage API.
 * Run: npm run test:api  (uses the react-server condition so `server-only` imports resolve)
 */
import assert from 'node:assert/strict';

// Fake, non-secret configuration so the routes take the "configured" path
process.env.SUPABASE_URL = 'https://project.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test_only';
process.env.SUPABASE_ANON_KEY = 'sb_publishable_test_only';
delete process.env.AIRTABLE_API_KEY;

type Call = { url: string; method: string; body: string | null; size: number };
let calls: Call[] = [];
let rpcResponse: () => Response = () => new Response(JSON.stringify({ request_id: 'r1', application_id: 'a1', duplicate: false }), { status: 200 });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = init?.body;
  const text = typeof body === 'string' ? body : null;
  const size = body instanceof Uint8Array ? body.byteLength : text?.length ?? 0;
  calls.push({ url, method: init?.method ?? 'GET', body: text, size });
  if (url.includes('/rest/v1/communities')) return new Response('[]', { status: 200 }); // empty → static fallback list
  if (url.includes('/rest/v1/rpc/')) return rpcResponse();
  if (url.includes('/storage/v1/object')) return new Response('{}', { status: 200 });
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

const logs: string[] = [];
const origError = console.error;
console.error = (...args: unknown[]) => logs.push(args.map(String).join(' '));
console.info = () => {};

let ip = 0;
const headers = (extra: Record<string, string> = {}) => ({ 'x-real-ip': `10.0.0.${++ip}`, ...extra });
const key = () => crypto.randomUUID();
const pdf = (size = 2048) => {
  const b = new Uint8Array(size);
  b.set(new TextEncoder().encode('%PDF-1.7\n'));
  return b;
};

const contact = (over: Record<string, unknown> = {}) => ({
  locale: 'it', firstName: 'Giulia', lastName: 'Rossi', email: 'giulia@example.com', company: 'Acme', role: 'CEO',
  profileType: 'founder', interest: 'Partner', consent: true, elapsedMs: 5000, idempotencyKey: key(), ...over,
});
const join = (over: Record<string, unknown> = {}) => ({
  locale: 'en', firstName: 'Marco', lastName: 'Bianchi', email: 'marco@example.com', company: 'Acme', role: 'fundraising',
  profileType: 'startup', submissionType: 'pitch', consent: true, elapsedMs: 5000, idempotencyKey: key(),
  application: { startupName: 'Acme', companyIncorporated: 'no', cityProvince: 'Milano', sector: 'Cleantech', serviceInterest: 'fundraising' },
  ...over,
});
const joinForm = (payload: unknown, file?: { bytes: Uint8Array; name: string; type: string }) => {
  const fd = new FormData();
  fd.set('payload', JSON.stringify(payload));
  if (file) fd.set('file', new File([file.bytes as BlobPart], file.name, { type: file.type }));
  return fd;
};

let n = 0;
async function test(name: string, fn: () => Promise<void>) {
  calls = [];
  logs.length = 0;
  rpcResponse = () => new Response(JSON.stringify({ request_id: 'r1', application_id: 'a1', duplicate: false }), { status: 200 });
  await fn();
  n++;
  process.stdout.write(`✓ ${name}\n`);
}

async function main() {
  const lead = await import('../app/api/lead/route');
  const joinRoute = await import('../app/api/join/route');
  const community = await import('../app/api/community/route');
  const post = (path: string, body: BodyInit, h: Record<string, string> = {}) => new Request(`http://localhost${path}`, { method: 'POST', headers: headers(h), body });

  // ── /api/lead (Connettiti con Rainmakers) ──
  await test('lead: cross-origin request is refused (403)', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact()), { origin: 'https://evil.example' }));
    assert.equal(r.status, 403);
    assert.equal(calls.length, 0);
  });
  await test('lead: honeypot → fake success, nothing stored', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact({ company_website_hp: 'spam' }))));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 0);
  });
  await test('lead: server-side validation with field codes (422)', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact({ email: 'nope', consent: false }))));
    assert.equal(r.status, 422);
    const j = await r.json();
    assert.equal(j.fields.email, 'email');
    assert.equal(j.fields.consent, 'consent');
    assert.equal(calls.length, 0);
  });
  await test('lead: missing idempotency key rejected', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact({ idempotencyKey: undefined }))));
    assert.equal(r.status, 422);
  });
  await test('lead: valid → submit_contact only (no newsletter / marketing call)', async () => {
    const payload = contact();
    const r = await lead.POST(post('/api/lead', JSON.stringify(payload)));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/rest/v1/rpc/submit_contact'));
    const p = JSON.parse(calls[0].body!).p;
    assert.equal(p.idempotency_key, payload.idempotencyKey);
    assert.equal(p.email, 'giulia@example.com');
    assert.ok(!calls.some((c) => c.url.includes('newsletter')));
  });
  await test('lead: duplicate submission reported as success', async () => {
    rpcResponse = () => new Response(JSON.stringify({ request_id: 'r1', duplicate: true }), { status: 200 });
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact())));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).duplicate, true);
  });
  await test('lead: database rate limit → 429', async () => {
    rpcResponse = () => new Response('{"message":"rate_limited"}', { status: 400 });
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact())));
    assert.equal(r.status, 429);
  });
  await test('lead: database error → 500, personal data not logged', async () => {
    rpcResponse = () => new Response('{"message":"boom"}', { status: 500 });
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact())));
    assert.equal(r.status, 500);
    assert.ok(logs.length > 0);
    assert.ok(!logs.join(' ').includes('giulia@example.com'));
  });
  await test('lead: oversized body → 413', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact({ interest: 'x'.repeat(20000) }))));
    assert.equal(r.status, 413);
  });

  // ── /api/join (Join the Tribe) ──
  await test('join: neither file nor link → 422 fileOrLink, nothing uploaded', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join())));
    assert.equal(r.status, 422);
    assert.equal((await r.json()).fields.file, 'fileOrLink');
    assert.equal(calls.length, 0);
  });
  await test('join: renamed non-PDF (bad signature) → 422 fileType', async () => {
    const fake = new TextEncoder().encode('MZ this is an executable');
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: fake, name: 'deck.pdf', type: 'application/pdf' })));
    assert.equal(r.status, 422);
    assert.equal((await r.json()).fields.file, 'fileType');
    assert.equal(calls.length, 0);
  });
  await test('join: wrong extension → 422 fileType', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: pdf(), name: 'deck.docx', type: 'application/pdf' })));
    assert.equal((await r.json()).fields.file, 'fileType');
  });
  await test('join: file over 4 MB → rejected before upload', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: pdf(4 * 1024 * 1024 + 10), name: 'deck.pdf', type: 'application/pdf' })));
    assert.ok(r.status === 413 || r.status === 422);
    assert.equal((await r.json()).fields.file, 'fileTooLarge');
    assert.ok(!calls.some((c) => c.url.includes('/storage/')));
  });
  await test('join: valid PDF → private upload (unpredictable path) then row with the path', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: pdf(), name: 'My Deck.pdf', type: 'application/pdf' })));
    assert.equal(r.status, 200);
    const upload = calls.find((c) => c.method === 'POST' && c.url.includes('/storage/v1/object/join-documents/'));
    assert.ok(upload, 'uploaded to the join-documents bucket');
    const path = upload!.url.split('/join-documents/')[1];
    assert.ok(/^pitch\/[0-9]{4}\/[0-9]{2}\/[0-9a-f-]{36}\.pdf$/.test(path), path);
    const rpc = calls.find((c) => c.url.endsWith('/rpc/submit_join_application'))!;
    const p = JSON.parse(rpc.body!).p;
    assert.equal(p.storage_path, path);
    assert.equal(p.file_name, 'My_Deck.pdf');
    assert.equal(p.kind, 'pitch');
    assert.equal(p.role, null); // the pitch "role" field (service) is not stored as a job title
    assert.ok(calls.indexOf(upload!) < calls.indexOf(rpc), 'upload happens before the insert');
  });
  await test('join: link only → no upload, row stored', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join({ submissionType: 'cv', profileType: 'other', role: 'Designer', application: undefined, link: 'https://linkedin.com/in/marco' }))));
    assert.equal(r.status, 200);
    assert.ok(!calls.some((c) => c.url.includes('/storage/')));
    assert.ok(calls.some((c) => c.url.endsWith('/rpc/submit_join_application')));
  });
  await test('join: database failure after upload → uploaded file deleted (no orphan)', async () => {
    rpcResponse = () => new Response('{"message":"boom"}', { status: 500 });
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: pdf(), name: 'deck.pdf', type: 'application/pdf' })));
    assert.equal(r.status, 500);
    const uploaded = calls.find((c) => c.method === 'POST' && c.url.includes('/join-documents/'))!.url.split('/join-documents/')[1];
    const del = calls.find((c) => c.method === 'DELETE');
    assert.ok(del, 'cleanup called');
    assert.deepEqual(JSON.parse(del!.body!).prefixes, [uploaded]);
  });
  await test('join: duplicate submission → extra upload deleted, success returned', async () => {
    rpcResponse = () => new Response(JSON.stringify({ application_id: 'a1', duplicate: true }), { status: 200 });
    const r = await joinRoute.POST(post('/api/join', joinForm(join(), { bytes: pdf(), name: 'deck.pdf', type: 'application/pdf' })));
    assert.equal(r.status, 200);
    assert.ok(calls.some((c) => c.method === 'DELETE'));
  });
  await test('join: pitch without application → 422', async () => {
    const r = await joinRoute.POST(post('/api/join', joinForm(join({ application: undefined, link: 'https://deck.example' }))));
    assert.equal(r.status, 422);
  });

  // ── /api/community (Entra su WhatsApp) ──
  const req = (over: Record<string, unknown> = {}) => ({ locale: 'it', firstName: 'Ann', email: 'ann@example.com', community: 'italian-rainforest', consent: true, elapsedMs: 5000, ...over });
  await test('community: valid → stored, WhatsApp link returned', async () => {
    const r = await community.POST(post('/api/community', JSON.stringify(req())));
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.ok(String(j.whatsappUrl).startsWith('https://chat.whatsapp.com/'));
    assert.ok(calls.some((c) => c.url.endsWith('/rpc/submit_community_request')));
    assert.ok(!calls.some((c) => c.url.includes('newsletter')));
  });
  await test('community: unknown or not-open community → 422, nothing stored', async () => {
    for (const slug of ['does-not-exist', 'rainmakers-community']) {
      calls = [];
      const r = await community.POST(post('/api/community', JSON.stringify(req({ community: slug }))));
      assert.equal(r.status, 422);
      assert.ok(!calls.some((c) => c.url.includes('/rpc/')));
    }
  });
  await test('community: consent required', async () => {
    const r = await community.POST(post('/api/community', JSON.stringify(req({ consent: false }))));
    assert.equal(r.status, 422);
  });

  // ── Secrets never leave the server ──
  await test('responses never contain the service key', async () => {
    const r = await lead.POST(post('/api/lead', JSON.stringify(contact())));
    assert.ok(!(await r.text()).includes('sb_secret_test_only'));
  });

  console.error = origError;
  console.log(`\n${n} API tests passed`);
}

main().catch((e) => {
  console.error = origError;
  console.error(e);
  process.exit(1);
});
