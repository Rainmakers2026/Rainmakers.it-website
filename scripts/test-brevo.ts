/**
 * "Gocce di Innovazione" double opt-in, unsubscribe and the transactional emails, on the CRM (0010_crm.sql), without
 * network or credentials: real route handlers, stubbed Supabase RPC and Brevo API. No email is sent.
 * Since 2026-11-11 nobody is added to a Brevo list here: the Brevo sync is prepared but off (lib/crm/sync.ts).
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
process.env.CRON_SECRET = 'cron-test-secret';
process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example.test';
process.env.NEWSLETTER_LINK_SECRET = 'test-only-newsletter-link-secret-0123456789';

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
const CONTACT = '3f2a1c9e-1b2c-4d5e-8f90-123456789abc';

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
  const unsubscribe = await import('../app/api/newsletter/unsubscribe/route');
  const cron = await import('../app/api/cron/brevo-retry/route');
  const lead = await import('../app/api/lead/route');
  const { unsubscribeUrl } = await import('../lib/crm/links');

  // ── A. Newsletter request (dedicated form) ──
  await test('newsletter: consent is mandatory (422, nothing stored or sent)', async () => {
    const r = await newsletter.POST(post('/api/newsletter', sub({ consent: false })));
    assert.equal(r.status, 422);
    assert.equal(calls.length, 0);
  });
  await test('newsletter: invalid email or unknown interest rejected server-side', async () => {
    for (const body of [sub({ email: 'not-an-email' }), sub({ interests: ['rainforest_radar'] })]) {
      const r = await newsletter.POST(post('/api/newsletter', body));
      assert.equal(r.status, 422);
    }
    assert.equal(calls.length, 0);
  });
  await test('newsletter: new address → pending_confirmation + confirmation email; never a Brevo list', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    const r = await newsletter.POST(post('/api/newsletter', sub({ firstName: ' Anna ', interests: ['giveback', 'advisory', 'giveback'] })));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).state, 'pending');
    const p = rpcCalls('crm_newsletter_subscribe')[0].body!.p as Record<string, unknown>;
    assert.equal(p.email, 'anna@example.com', 'normalised');
    assert.equal(p.first_name, 'Anna');
    assert.deepEqual(p.interests, ['giveback', 'advisory'], 'deduplicated editorial interests');
    assert.equal(p.source, 'rm_newsletter_gdi_v1');
    assert.ok(String(p.consent_version).length > 0, 'consent version recorded');
    assert.match(String(p.token_hash), /^[0-9a-f]{64}$/, 'only the hash goes to the database');
    const mail = brevoCalls('/smtp/email');
    assert.equal(mail.length, 1);
    assert.equal(brevoCalls('/contacts').length, 0, 'no list subscription');
    const html = String(mail[0].body!.htmlContent);
    assert.match(String(mail[0].body!.subject), /Gocce di Innovazione/);
    const token = html.match(/confirm\?token=([A-Za-z0-9_-]{43})/)![1];
    assert.equal(createHash('sha256').update(token).digest('hex'), p.token_hash, 'emailed token matches stored hash');
    assert.ok(html.includes('https://site.example.test/it/newsletter/confirm'));
    assert.deepEqual(rpcCalls('crm_newsletter_record_confirmation')[0].body, { p_id: 's1', p_ok: true });
  });
  await test('newsletter: already confirmed → "already", no email', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ id: 's1', action: 'already_subscribed' });
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal((await r.json()).state, 'already');
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: confirmation sent minutes ago → no second email', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ id: 's1', action: 'confirmation_recent' });
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal((await r.json()).state, 'pending_recent');
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: Brevo failure → request kept, honest "email_failed" (503), failure recorded', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
    brevo['/smtp/email'] = () => ok({ code: 'internal_error' }, 500);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal(r.status, 503);
    assert.equal((await r.json()).state, 'email_failed');
    assert.deepEqual(rpcCalls('crm_newsletter_record_confirmation')[0].body, { p_id: 's1', p_ok: false });
  });
  await test('newsletter: database error → 500, no email', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ message: 'boom' }, 500);
    const r = await newsletter.POST(post('/api/newsletter', sub()));
    assert.equal(r.status, 500);
    assert.equal(brevoCalls().length, 0);
  });
  await test('newsletter: honeypot → looks fine, nothing stored or sent', async () => {
    const r = await newsletter.POST(post('/api/newsletter', sub({ website: 'bot' })));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 0);
  });

  // ── B. Confirmation (double opt-in) ──
  const token = 'A'.repeat(43);
  await test('confirm: malformed token → 400, no database call', async () => {
    const r = await confirm.POST(post('/api/newsletter/confirm', { token: 'short' }));
    assert.equal(r.status, 400);
    assert.equal(calls.length, 0);
  });
  await test('confirm: valid → one welcome email with the unsubscribe link + notice; still no Brevo list', async () => {
    rpc.crm_newsletter_confirm = () => ok({ id: 's1', contact_id: CONTACT, action: 'confirmed', email: 'anna@example.com', language: 'en', needs_welcome: true });
    rpc.crm_claim_ack = () => ok({ email: 'anna@example.com', language: 'en', contact_id: CONTACT });
    const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
    const j = await r.json();
    assert.equal(j.state, 'confirmed');
    assert.ok(String(j.unsubscribeUrl).startsWith(`https://site.example.test/en/newsletter/unsubscribe?c=${CONTACT}&t=`));
    assert.equal(rpcCalls('crm_newsletter_confirm')[0].body!.p_token_hash, createHash('sha256').update(token).digest('hex'));
    assert.equal(brevoCalls('/contacts').length, 0, 'the list sync is not active');
    const mails = brevoCalls('/smtp/email');
    const welcome = mails.filter((m) => /Welcome/.test(String(m.body!.subject)));
    assert.equal(welcome.length, 1);
    assert.ok(String(welcome[0].body!.htmlContent).includes('/en/newsletter/unsubscribe?c='), 'unsubscribe link in the welcome email');
    assert.deepEqual(rpcCalls('crm_finish_ack')[0].body, { p_kind: 'newsletter', p_id: 's1', p_ok: true });
    assert.ok(mails.find((m) => (m.body!.to as { email: string }[])[0].email === 'tools@nuvolab.com'), 'newsletter inbox notified');
  });
  await test('confirm: retry/double click → welcome already claimed → no second email', async () => {
    rpc.crm_newsletter_confirm = () => ok({ id: 's1', contact_id: CONTACT, action: 'already_confirmed', email: 'anna@example.com', language: 'it', needs_welcome: true });
    rpc.crm_claim_ack = () => ok({});
    const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.equal((await r.json()).state, 'already_confirmed');
    assert.equal(brevoCalls('/smtp/email').length, 0);
  });
  await test('confirm: welcome email fails → claim released for the retry job', async () => {
    rpc.crm_newsletter_confirm = () => ok({ id: 's1', contact_id: CONTACT, action: 'confirmed', email: 'anna@example.com', language: 'it', needs_welcome: true });
    rpc.crm_claim_ack = () => ok({ email: 'anna@example.com', language: 'it', contact_id: CONTACT });
    brevo['/smtp/email'] = () => ok({ code: 'internal_error' }, 500);
    await confirm.POST(post('/api/newsletter/confirm', { token }));
    assert.deepEqual(rpcCalls('crm_finish_ack')[0].body, { p_kind: 'newsletter', p_id: 's1', p_ok: false });
  });
  await test('confirm: expired / invalid tokens → no email', async () => {
    for (const action of ['expired', 'invalid']) {
      calls = [];
      rpc.crm_newsletter_confirm = () => ok({ action });
      const r = await confirm.POST(post('/api/newsletter/confirm', { token }));
      assert.equal((await r.json()).state, action);
      assert.equal(brevoCalls().length, 0);
    }
  });

  // ── C. Unsubscribe (signed link) ──
  const link = new URL(unsubscribeUrl('https://site.example.test', 'it', CONTACT)!);
  const c = link.searchParams.get('c');
  const t = link.searchParams.get('t');
  await test('unsubscribe: valid signed link → unsubscribed in Supabase', async () => {
    rpc.crm_newsletter_unsubscribe = () => ok({ action: 'unsubscribed' });
    const r = await unsubscribe.POST(post('/api/newsletter/unsubscribe', { c, t }));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).state, 'unsubscribed');
    assert.deepEqual(rpcCalls('crm_newsletter_unsubscribe')[0].body, { p_contact: CONTACT, p_source: 'email_link' });
    assert.equal(brevoCalls().length, 0);
  });
  await test('unsubscribe: second click → "already"', async () => {
    rpc.crm_newsletter_unsubscribe = () => ok({ action: 'already' });
    const r = await unsubscribe.POST(post('/api/newsletter/unsubscribe', { c, t }));
    assert.equal((await r.json()).state, 'already');
  });
  await test('unsubscribe: forged or someone else’s signature → 400, database untouched', async () => {
    const other = '00000000-0000-4000-8000-000000000000';
    for (const body of [{ c, t: 'x'.repeat(43) }, { c: other, t }, { c, t: undefined }, { c: "1' or 1=1", t }]) {
      const r = await unsubscribe.POST(post('/api/newsletter/unsubscribe', body));
      assert.equal(r.status, 400);
    }
    assert.equal(calls.length, 0);
  });

  // ── D. Retry job ──
  await test('cron: requires the CRON_SECRET bearer token', async () => {
    const r = await cron.GET(new Request('http://localhost/api/cron/brevo-retry'));
    assert.equal(r.status, 401);
    const r2 = await cron.GET(new Request('http://localhost/api/cron/brevo-retry', { headers: { authorization: 'Bearer wrong' } }));
    assert.equal(r2.status, 401);
    assert.equal(calls.length, 0);
  });
  await test('cron: resends failed welcome and acknowledgement emails, never a list sync', async () => {
    rpc.crm_pending_emails = () => ok({ newsletter: ['s2'], submissions: ['f9'] });
    let claims = 0;
    rpc.crm_claim_ack = (a) =>
      (claims++, ok(a.p_kind === 'submission' ? { email: 'c@example.com', language: 'en', first_name: 'C', form_type: 'job_application' } : { email: 'b@example.com', language: 'it', contact_id: CONTACT }));
    const r = await cron.GET(new Request('http://localhost/api/cron/brevo-retry', { headers: { authorization: 'Bearer cron-test-secret' } }));
    const j = await r.json();
    assert.equal(r.status, 200);
    assert.equal(j.sent, 2);
    assert.equal(claims, 2);
    assert.equal(brevoCalls('/contacts').length, 0);
  });

  // ── E. The contact form never touches Brevo ──
  await test('contact form: no Brevo call at all (not a newsletter subscription)', async () => {
    rpc.submit_contact = () => ok({ request_id: 'r1', duplicate: false });
    const r = await lead.POST(
      post('/api/lead', { locale: 'it', firstName: 'G', lastName: 'R', email: 'g@example.com', company: 'A', role: 'B', profileType: 'founder', consent: true, elapsedMs: 5000, idempotencyKey: crypto.randomUUID() }),
    );
    assert.equal(r.status, 200);
    assert.equal(brevoCalls().length, 0);
    assert.equal(rpcCalls('crm_newsletter_subscribe').length, 0);
  });

  // ── F. Secrets and personal data ──
  await test('API key and addresses never appear in responses or logs', async () => {
    rpc.crm_newsletter_subscribe = () => ok({ id: 's1', action: 'send_confirmation' });
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
