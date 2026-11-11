/**
 * API route tests for the Supabase-backed forms (Phase 4) other than "Come vuoi iniziare?" (scripts/test-crm.ts),
 * without network or credentials:
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
  if (url.startsWith('https://api.brevo.com/')) return new Response('{"messageId":"m1"}', { status: 201 });
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

const logs: string[] = [];
const origError = console.error;
console.error = (...args: unknown[]) => logs.push(args.map(String).join(' '));
console.info = () => {};

let ip = 0;
const headers = (extra: Record<string, string> = {}) => ({ 'x-real-ip': `10.0.0.${++ip}`, ...extra });
const key = () => crypto.randomUUID();
const contact = (over: Record<string, unknown> = {}) => ({
  locale: 'it', firstName: 'Giulia', lastName: 'Rossi', email: 'giulia@example.com', company: 'Acme', role: 'CEO',
  profileType: 'founder', interest: 'Partner', consent: true, elapsedMs: 5000, idempotencyKey: key(), ...over,
});
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
  const community = await import('../app/api/community/route');
  const reviewRoute = await import('../app/api/review/route');
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

  // The "Come vuoi iniziare?" forms (/api/join) are tested against the CRM in scripts/test-crm.ts (2026-11-11)

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

  // ── /api/review ("Lascia una review" popup) ──
  const review = (over: Record<string, unknown> = {}) => ({
    locale: 'it', name: 'Giulia Rossi', email: 'giulia@example.com', company: 'Acme', rating: 5,
    review: 'Rainmakers ci ha aperto porte che da soli non avremmo trovato.', publishConsent: true, consent: true,
    elapsedMs: 5000, idempotencyKey: key(), ...over,
  });
  const withBrevo = async (fn: () => Promise<void>) => {
    process.env.BREVO_API_KEY = 'xkeysib-test-only';
    process.env.BREVO_FROM_EMAIL = 'noreply@rainmakers.it';
    try {
      await fn();
    } finally {
      delete process.env.BREVO_API_KEY;
      delete process.env.BREVO_FROM_EMAIL;
    }
  };
  const reviewOk = () => new Response(JSON.stringify({ review_id: 'rv1', duplicate: false }), { status: 200 });

  await test('review: too short / no consent → 422 with field codes, nothing stored', async () => {
    const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review({ review: 'Ottimo', consent: false }))));
    assert.equal(r.status, 422);
    const b = (await r.json()) as { fields: Record<string, string> };
    assert.equal(b.fields.review, 'tooShort');
    assert.equal(b.fields.consent, 'consent');
    assert.equal(calls.length, 0);
  });
  await test('review: honeypot → fake success, nothing stored or emailed', async () => {
    const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review({ company_website_hp: 'spam' }))));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 0);
  });
  await test('review: valid → stored, emailed to tools@nuvolab.com (reply-to author), marked notified', async () => {
    rpcResponse = reviewOk;
    await withBrevo(async () => {
      const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review())));
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), { ok: true, stored: true, emailed: true });
    });
    assert.ok(calls[0].url.endsWith('/rest/v1/rpc/submit_review'));
    const stored = JSON.parse(calls[0].body!).p;
    assert.equal(stored.body.startsWith('Rainmakers ci ha'), true);
    assert.equal(stored.publish_consent, true);
    assert.equal(stored.rating, 5);
    const mail = calls.find((c) => c.url === 'https://api.brevo.com/v3/smtp/email');
    assert.ok(mail, 'team email sent');
    const m = JSON.parse(mail!.body!);
    assert.deepEqual(m.to, [{ email: 'tools@nuvolab.com' }]);
    assert.deepEqual(m.replyTo, { email: 'giulia@example.com' });
    assert.ok(!calls.some((c) => c.url.includes('/contacts')), 'never added to a marketing list');
    assert.ok(calls.some((c) => c.url.endsWith('/rest/v1/rpc/review_mark_notified')));
    // the author is linked in the CRM: review id only, never the text again, never a newsletter
    const crm = JSON.parse(calls.find((c) => c.url.endsWith('/rest/v1/rpc/crm_submit'))!.body!).p;
    assert.equal(crm.form_type, 'review');
    assert.deepEqual(crm.data, { review_id: 'rv1', rating: 5, publish_consent: true });
    assert.equal(crm.message, null);
    assert.equal(crm.newsletter.opt_in, false);
  });
  await test('review: Brevo not configured → still stored, honest emailed:false', async () => {
    rpcResponse = reviewOk;
    const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review())));
    assert.deepEqual(await r.json(), { ok: true, stored: true, emailed: false });
    assert.ok(!calls.some((c) => c.url.includes('brevo')));
  });
  await test('review: duplicate submission → success, no second email', async () => {
    rpcResponse = () => new Response(JSON.stringify({ review_id: 'rv1', duplicate: true }), { status: 200 });
    await withBrevo(async () => {
      const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review())));
      assert.equal(r.status, 200);
    });
    assert.ok(!calls.some((c) => c.url.includes('brevo')));
  });
  await test('review: database error → 500, review text not logged', async () => {
    rpcResponse = () => new Response('{"message":"boom"}', { status: 500 });
    const r = await reviewRoute.POST(post('/api/review', JSON.stringify(review())));
    assert.equal(r.status, 500);
    assert.ok(!logs.join(' ').includes('porte che da soli'));
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
