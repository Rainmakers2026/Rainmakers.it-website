/**
 * Newsletter double opt-in + Brevo + welcome-email tests (Phase 5), without network or credentials:
 * real route handlers, stubbed Supabase RPC and Brevo API. No email is sent.
 * Run: npm run test:brevo
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

process.env.SUPABASE_URL = 'https://project.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test_only';
process.env.BREVO_API_KEY = 'xkeysib-test-only';
process.env.BREVO_FROM_EMAIL = 'newsletter@example.test';
process.env.BREVO_FROM_NAME = 'Rainmakers';
process.env.BREVO_REPLY_TO = 'info@example.test';
process.env.BREVO_CONTACTS_LIST_ID = '7';
process.env.CRON_SECRET = 'cron-test-secret';
process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example.test';

type Call = { url: string; method: string; body: Record<string, unknown> | null; headers: Record<string, string> };
let calls: Call[] = [];
type Responder = (args: Record<string, unknown>) => Response;
let rpc: Record<string, Responder> = {};
let brevo: Record<string, () => Response> = {};
const ok = (data: unknown, status = 200) => new Response(data === undefined ? '' : JSON.stringify(data), { status });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ url, method: init?.method ?? 'GET', body, headers: (init?.headers ?? {}) as Record<string, string> });
  const m = url.match(/\/rest\/v1\/rpc\/(\w+)$/);
  if (m) return (rpc[m[1]] ?? (() => ok(null)))(body ?? {});
  if (url.startsWith('https://api.brevo.com/v3/')) {
    const path = url.replace('https://api.brevo.com/v3', '');
    return (brevo[path] ?? (() => ok({ messageId: 'm1' }, 201)))();
  }
  if (url.includes('/rest/v1/communities')) return ok([]);
  if (url.includes('/storage/v1/object')) return ok({});
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

const logs: string[] = [];
const origError = console.error;
console.error = (...a: unknown[]) => logs.push(a.map(String).join(' '));
console.info = () => {};

let ip = 0;
const post = (path: string, body: unknown, h: Record<string, string> = {}) =>
  new Request(`http://localhost${path}`, { method: 'POST', headers: { 'x-real-ip': `10.1.0.${++ip}`, 'Content-Type': 'application/json', ...h }, body: JSON.stringify(body) });
const sub = (over: Record<string, unknown> = {}) => ({ email: '  Anna@Example.COM ', locale: 'it', consent: true, source: 'footer', elapsedMs: 5000, ...over });
const brevoCalls = (path?: string) => calls.filter((c) => c.url.startsWith('https://api.brevo.com') && (!path || c.url.endsWith(path)));
const rpcCalls = (fn: string) => calls.filter((c) => c.url.endsWith(`/rpc/${fn}`));

let n = 0;
async function test(name: string, fn: () => Promise<void>) {
  calls = [];
  logs.length = 0;
  rpc = {};
  brevo = {};
  await fn();
  n++;
  process.stdout.write(`✓ ${name}\n`);
}

async function main() {
  const newsletter = await import('../app/api/newsletter/route');
  const confirm = await import('../app/api/newsletter/confirm/route');
  const cron = await import('../app/api/cron/brevo-retry/route');
  const lead = await import('../app/api/lead/route');
  const join = await import('../app/api/join/route');

  // ── A. Newsletter request ──
  await test('newsletter: consent is mandatory (422, nothing stored or sent)', async () => {
    const r = await newsletter.POST(post('/api/newsletter', sub({ consent: false })));
    assert.equal(r.status, 422);
    assert.equal(calls.length, 0);
  });
  await test('newsletter: invalid email rejected server-side', async () => {
    const r = await newsletter.POST(post('/api/newsletter', sub({ email: 'not-an-email' })));
    assert.equal(r.status, 422);
    assert.equal(calls.length, 0);
  });
  await test('newsletter: new address → pending + confirmation email; NOT added to "Contatti" yet', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).state, 'pending');
    const p = rpcCalls('newsletter_subscribe')[0].body!.p as Record<string, unknown>;
    assert.equal(p.email, 'anna@example.com', 'normalised');
    assert.equal(p.consent, true);
    assert.ok(String(p.consent_version).length > 0, 'consent version recorded');
    assert.match(String(p.token_hash), /^[0-9a-f]{64}$/, 'only the hash goes to the database');
    const mail = brevoCalls('/smtp/email');
    assert.equal(mail.length, 1);
    assert.equal(brevoCalls('/contacts').length, 0, 'no list subscription before confirmation');
    const html = String(mail[0].body!.htmlContent);
    const token = html.match(/confirm\?token=([A-Za-z0-9_-]{43})/)![1];
    assert.equal(createHash('sha256').update(token).digest('hex'), p.token_hash, 'emailed token matches stored hash');
    assert.ok(html.includes('https://site.example.test/it/newsletter/confirm'));
    assert.deepEqual((mail[0].body!.to as { email: string }[])[0].email, 'anna@example.com');
    assert.deepEqual(mail[0].body!.replyTo, { email: 'info@example.test' });
    assert.equal(mail[0].headers['api-key'], 'xkeysib-test-only');
    assert.deepEqual(rpcCalls('newsletter_record_confirmation')[0].body, { p_id: 's1', p_ok: true });
  });
  await test('newsletter: already confirmed → "already", no email', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'already_subscribed' });
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal((await r.json()).state, 'already');
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: confirmation sent minutes ago → no second email', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'confirmation_recent' });
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal((await r.json()).state, 'pending_recent');
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: Brevo failure → subscription kept, honest "email_failed" (503), failure recorded', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    brevo['/smtp/email'] = () => ok({ code: 'internal_error' }, 500);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal(r.status, 503);
    assert.equal((await r.json()).state, 'email_failed');
    assert.deepEqual(rpcCalls('newsletter_record_confirmation')[0].body, { p_id: 's1', p_ok: false });
  });
  await test('newsletter: Brevo rate limit (429) handled the same way', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    brevo['/smtp/email'] = () => ok({ code: 'too_many_requests' }, 429);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal((await r.json()).state, 'email_failed');
  });
  await test('newsletter: database error → 500, no email', async () => {
    rpc.newsletter_subscribe = () => ok({ message: 'boom' }, 500);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal(r.status, 500);
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: honeypot → looks fine, nothing stored or sent', async () => {
    const r = await newsletter.POST(post('/api/newsletter', sub({ website: 'bot' })));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 0);
  });

  // ── Confirmation (double opt-in) ──
  const token = 'A'.repeat(43);
  await test('confirm: malformed token → 400, no database call', async () => {
    const r = await confirm.POST(post('/api/newsletter/confirm', { token: 'short' }));
    assert.equal(r.status, 400);
    assert.equal(calls.length, 0);
  });
  await test('confirm: valid → added to "Contatti" (list 7, updateEnabled) + one welcome email', async () => {
    rpc.newsletter_confirm = () => ok({ id: 's1', action: 'confirmed', email: 'anna@example.com', language: 'en', needs_sync: true, needs_welcome: true });
    rpc.rm_claim_welcome = () => ok({ email: 'anna@example.com', language: 'en' });
    const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.equal((await r.json()).state, 'confirmed');
    assert.equal(rpcCalls('newsletter_confirm')[0].body!.p_token_hash, createHash('sha256').update(token).digest('hex'));
    const contact = brevoCalls('/contacts')[0];
    assert.deepEqual(contact.body, { email: 'anna@example.com', listIds: [7], updateEnabled: true });
    assert.deepEqual(rpcCalls('newsletter_record_sync')[0].body, { p_id: 's1', p_ok: true, p_error: null });
    const mails = brevoCalls('/smtp/email');
    assert.equal(mails.length, 1);
    assert.match(String(mails[0].body!.subject), /Welcome/);
  });
  await test('confirm: retry/double click → welcome claim already taken → no second email', async () => {
    rpc.newsletter_confirm = () => ok({ id: 's1', action: 'already_confirmed', email: 'anna@example.com', language: 'it', needs_sync: false, needs_welcome: true });
    rpc.rm_claim_welcome = () => ok({}); // claimed by the first request
    const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.equal((await r.json()).state, 'already_confirmed');
    assert.equal(brevoCalls('/smtp/email').length, 0);
    assert.equal(brevoCalls('/contacts').length, 0);
  });
  await test('confirm: existing Brevo contact ("duplicate_parameter") counts as synced', async () => {
    rpc.newsletter_confirm = () => ok({ id: 's1', action: 'confirmed', email: 'anna@example.com', language: 'it', needs_sync: true, needs_welcome: false });
    brevo['/contacts'] = () => ok({ code: 'duplicate_parameter', message: 'Contact already exist' }, 400);
    await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.deepEqual(rpcCalls('newsletter_record_sync')[0].body, { p_id: 's1', p_ok: true, p_error: null });
  });
  await test('confirm: list sync fails (429) → still confirmed, failure recorded for the retry job', async () => {
    rpc.newsletter_confirm = () => ok({ id: 's1', action: 'confirmed', email: 'anna@example.com', language: 'it', needs_sync: true, needs_welcome: false });
    brevo['/contacts'] = () => ok({ code: 'too_many_requests' }, 429);
    const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.equal((await r.json()).state, 'confirmed');
    assert.deepEqual(rpcCalls('newsletter_record_sync')[0].body, { p_id: 's1', p_ok: false, p_error: 'rate_limited' });
  });
  await test('confirm: welcome email fails → claim released (retried later), never reported as sent twice', async () => {
    rpc.newsletter_confirm = () => ok({ id: 's1', action: 'confirmed', email: 'anna@example.com', language: 'it', needs_sync: false, needs_welcome: true });
    rpc.rm_claim_welcome = () => ok({ email: 'anna@example.com', language: 'it' });
    brevo['/smtp/email'] = () => ok({ code: 'internal_error' }, 500);
    await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.deepEqual(rpcCalls('rm_release_welcome')[0].body, { p_kind: 'newsletter', p_id: 's1' });
  });
  await test('confirm: expired / invalid tokens → no Brevo call', async () => {
    for (const action of ['expired', 'invalid']) {
      calls = [];
      rpc.newsletter_confirm = () => ok({ action });
      const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
      assert.equal((await r.json()).state, action);
      assert.equal(brevoCalls().length, 0);
    }
  });

  // ── Retry job ──
  await test('cron: requires the CRON_SECRET bearer token', async () => {
    const r = await cron.GET(new Request('http://localhost/api/cron/brevo-retry'));
    assert.equal(r.status, 401);
    const r2 = await cron.GET(new Request('http://localhost/api/cron/brevo-retry', { headers: { authorization: 'Bearer wrong' } }));
    assert.equal(r2.status, 401);
    assert.equal(calls.length, 0);
  });
  await test('cron: retries pending list syncs and failed welcomes', async () => {
    rpc.rm_brevo_pending_work = () =>
      ok({ newsletter: [{ id: 's2', email: 'b@example.com', language: 'it', needs_sync: true, needs_welcome: true }], join: ['j9'] });
    let claims = 0;
    rpc.rm_claim_welcome = (a) => (claims++, ok(a.p_kind === 'join' ? { email: 'c@example.com', language: 'en', first_name: 'C', kind: 'cv' } : { email: 'b@example.com', language: 'it' }));
    const r = await cron.GET(new Request('http://localhost/api/cron/brevo-retry', { headers: { authorization: 'Bearer cron-test-secret' } }));
    const j = await r.json();
    assert.equal(r.status, 200);
    assert.equal(j.synced, 1);
    assert.equal(j.welcomed, 2);
    assert.equal(claims, 2);
  });

  // ── B. Welcome for Join; contact form never touches Brevo ──
  await test('contact form: no Brevo call at all (not a newsletter subscription)', async () => {
    rpc.submit_contact = () => ok({ request_id: 'r1', duplicate: false });
    const r = await lead.POST(
      post('/api/lead', { locale: 'it', firstName: 'G', lastName: 'R', email: 'g@example.com', company: 'A', role: 'B', profileType: 'founder', consent: true, elapsedMs: 5000, idempotencyKey: crypto.randomUUID() }),
    );
    assert.equal(r.status, 200);
    assert.equal(brevoCalls().length, 0);
    assert.equal(rpcCalls('newsletter_subscribe').length, 0);
  });
  const joinPayload = () => ({
    locale: 'it', firstName: 'Marco', lastName: 'B', email: 'marco@example.com', company: 'Acme', role: 'Designer', profileType: 'other',
    submissionType: 'cv', link: 'https://linkedin.com/in/marco', consent: true, elapsedMs: 5000, idempotencyKey: crypto.randomUUID(),
  });
  const joinReq = (payload: unknown) => {
    const fd = new FormData();
    fd.set('payload', JSON.stringify(payload));
    return new Request('http://localhost/api/join', { method: 'POST', headers: { 'x-real-ip': `10.1.0.${++ip}` }, body: fd });
  };
  await test('join: new application → one "received" email (transactional), never the list', async () => {
    rpc.submit_join_application = () => ok({ application_id: 'a1', duplicate: false });
    rpc.rm_claim_welcome = () => ok({ email: 'marco@example.com', language: 'it', first_name: 'Marco', kind: 'cv' });
    const r = await join.POST(joinReq(joinPayload()));
    assert.equal(r.status, 200);
    assert.deepEqual(rpcCalls('rm_claim_welcome')[0].body, { p_kind: 'join', p_id: 'a1' });
    const mails = brevoCalls('/smtp/email');
    assert.equal(mails.length, 1);
    assert.match(String(mails[0].body!.htmlContent), /il tuo CV/);
    assert.equal(brevoCalls('/contacts').length, 0);
  });
  await test('join: duplicate submission → no email', async () => {
    rpc.submit_join_application = () => ok({ application_id: 'a1', duplicate: true });
    await join.POST(joinReq(joinPayload()));
    assert.equal(brevoCalls().length, 0);
  });
  await test('join: email failure does not fail the saved application', async () => {
    rpc.submit_join_application = () => ok({ application_id: 'a1', duplicate: false });
    rpc.rm_claim_welcome = () => ok({ email: 'marco@example.com', language: 'it', first_name: 'Marco', kind: 'cv' });
    brevo['/smtp/email'] = () => ok({}, 500);
    const r = await join.POST(joinReq(joinPayload()));
    assert.equal(r.status, 200);
    assert.ok(rpcCalls('rm_release_welcome').length === 1);
  });
  await test('join: first name is HTML-escaped in the email', async () => {
    rpc.submit_join_application = () => ok({ application_id: 'a1', duplicate: false });
    rpc.rm_claim_welcome = () => ok({ email: 'x@example.com', language: 'en', first_name: '<script>alert(1)</script>', kind: 'pitch' });
    await join.POST(joinReq(joinPayload()));
    const html = String(brevoCalls('/smtp/email')[0].body!.htmlContent);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  // ── C. Secrets and personal data ──
  await test('API key and addresses never appear in responses or logs', async () => {
    rpc.newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    brevo['/smtp/email'] = () => ok({ code: 'unauthorized' }, 401);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    const text = await r.text();
    assert.ok(!text.includes('xkeysib'));
    assert.ok(logs.length > 0);
    const all = logs.join(' ');
    assert.ok(!all.includes('xkeysib') && !all.includes('anna@example.com'));
  });

  console.error = origError;
  console.log(`\n${n} Brevo workflow tests passed`);
}

main().catch((e) => {
  console.error = origError;
  console.error(e);
  process.exit(1);
});
