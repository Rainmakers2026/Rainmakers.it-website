/**
 * CRM "Rainmakers OS" (2026-11-11): the "Come vuoi iniziare?" forms through POST /api/join, the shared schema, the
 * vocabulary shared with the database, and the prepared (inactive) syncs. Real route handlers, stubbed Supabase,
 * Storage and Brevo: no network, no credentials, no email sent.
 * The database side of the same scenarios (deduplication, shared organisations, interests, consents, RLS) is tested in
 * supabase/tests/0010_crm.sql.
 * Run: npm run test:crm
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.SUPABASE_URL = 'https://project.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test_only';
process.env.BREVO_API_KEY = 'xkeysib-test-only';
process.env.BREVO_FROM_EMAIL = 'noreply@example.test';
process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example.test';
// Even with Airtable credentials present, nothing may reach Airtable while the sync is off
process.env.AIRTABLE_API_KEY = 'pat-test-only';
process.env.AIRTABLE_BASE_ID = 'appTEST';
delete process.env.CRM_SYNC_AIRTABLE_ENABLED;
delete process.env.CRM_SYNC_BREVO_ENABLED;

type Call = { url: string; method: string; body: string | null };
let calls: Call[] = [];
let crmSubmit: (p: Record<string, unknown>) => Response;
const ok = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const submitted = (over: Record<string, unknown> = {}) =>
  ok({ contact_id: 'c1', organization_id: 'o1', submission_id: 'f1', duplicate: false, newsletter: null, ...over });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === 'string' ? init.body : null;
  calls.push({ url, method: init?.method ?? 'GET', body });
  if (url.endsWith('/rest/v1/rpc/crm_submit')) return crmSubmit((JSON.parse(body!) as { p: Record<string, unknown> }).p);
  if (url.endsWith('/rest/v1/rpc/crm_claim_ack')) return ok({ email: 'marta@example.com', first_name: 'Marta', language: 'it', form_type: 'startup_application' });
  if (url.includes('/rest/v1/rpc/')) return ok(null);
  if (url.includes('/storage/v1/object')) return ok({});
  if (url.startsWith('https://api.brevo.com/')) return ok({ messageId: 'm1' }, 201);
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

const logs: string[] = [];
const origError = console.error;
console.error = (...a: unknown[]) => logs.push(a.map(String).join(' '));
console.info = () => {};

let ip = 0;
const key = () => crypto.randomUUID();
const pdf = (size = 2048) => {
  const b = new Uint8Array(size);
  b.set(new TextEncoder().encode('%PDF-1.7\n'));
  return b;
};
/** A complete startup application ("Accelera la tua startup") */
const startup = (over: Record<string, unknown> = {}) => ({
  form: 'startup',
  locale: 'it',
  idempotencyKey: key(),
  sourcePage: '/it?utm_source=x#connect',
  utm: { utm_source: 'linkedin', utm_campaign: 'autunno' },
  firstName: 'Marta',
  lastName: 'Rossi',
  email: ' Marta.Rossi@Example.com ',
  organizationName: 'Acme',
  organizationWebsite: 'acme.it',
  playerType: 'startup',
  industry: 'fintech',
  country: 'IT',
  city: 'Milano',
  startupStage: 'seed',
  fundingStatus: 'raising_now',
  documentLink: 'https://acme.it/deck.pdf',
  privacy: true,
  newsletterOptIn: false,
  editorialInterests: [],
  elapsedMs: 5000,
  ...over,
});
const form = (payload: unknown, file?: { bytes: Uint8Array; name: string; type: string }) => {
  const fd = new FormData();
  fd.set('payload', JSON.stringify(payload));
  if (file) fd.set('file', new File([file.bytes as BlobPart], file.name, { type: file.type }));
  return fd;
};
const rpcBody = (fn: string) => calls.filter((c) => c.url.endsWith(`/rpc/${fn}`)).map((c) => JSON.parse(c.body!));
const mails = () => calls.filter((c) => c.url === 'https://api.brevo.com/v3/smtp/email').map((c) => JSON.parse(c.body!));
const to = (m: { to: { email: string }[] }) => m.to[0].email;
const external = () => calls.filter((c) => c.url.includes('api.airtable.com') || c.url.endsWith('/v3/contacts'));

let n = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  calls = [];
  logs.length = 0;
  crmSubmit = () => submitted();
  await fn();
  n++;
  process.stdout.write(`✓ ${name}\n`);
}

async function main() {
  const join = await import('../app/api/join/route');
  const webhook = await import('../app/api/webhooks/brevo/route');
  const { crmFormSchema, crmFieldErrors, submissionData } = await import('../lib/crm/schema');
  const taxonomy = await import('../lib/crm/taxonomy');
  const { FORMS } = await import('../lib/crm/forms');
  const sync = await import('../lib/crm/sync');
  const post = (body: BodyInit, h: Record<string, string> = {}) =>
    new Request('http://localhost/api/join', { method: 'POST', headers: { 'x-real-ip': `10.2.0.${++ip}`, referer: 'http://localhost/it/join', ...h }, body });

  // ── 1. New startup contact ──
  await test('1. new startup: one crm_submit with server-derived technical fields', async () => {
    const r = await join.POST(post(form(startup({ form_type: 'review', area: 'giveback', privacy_version: 'fake', source_brand: 'other' }))));
    assert.equal(r.status, 200);
    const p = rpcBody('crm_submit')[0].p;
    assert.equal(p.form_id, 'rm_startup_v1');
    assert.equal(p.form_type, 'startup_application', 'form type from the server, not the browser');
    assert.equal(p.area, 'open_venture_building');
    assert.equal(p.source_brand, 'rainmakers');
    assert.match(String(p.privacy_version), /^2026-11-privacy/);
    assert.equal(p.source_page, '/it/join', 'same-origin Referer path');
    assert.deepEqual(p.utm, { utm_source: 'linkedin', utm_campaign: 'autunno' });
    assert.equal(p.contact.email, 'marta.rossi@example.com', 'email normalised');
    assert.deepEqual(p.organization, { name: 'Acme', website: 'https://acme.it/', industry: 'fintech', country: 'IT', city: 'Milano' });
    assert.equal(p.player_type, 'startup');
    assert.deepEqual(p.data, { startup_stage: 'seed', funding_status: 'raising_now' }, 'only the startup block, snake_case');
    assert.equal(p.document.link, 'https://acme.it/deck.pdf');
    assert.equal(p.newsletter.opt_in, false);
    // team email to info@rainmakers.it (reply-to the person) + acknowledgement, nothing else
    const m = mails();
    assert.equal(m.length, 2);
    const team = m.find((x) => to(x) === 'info@rainmakers.it')!;
    assert.deepEqual(team.replyTo, { email: 'marta.rossi@example.com' });
    assert.match(team.htmlContent, /Fase della startup:<\/strong> Seed/);
    assert.ok(m.some((x) => to(x) === 'marta@example.com'), 'acknowledgement');
    assert.equal(external().length, 0, 'no Brevo list, no Airtable');
  });

  // ── 2. Same contact, second form ──
  await test('2. same person, second form (different case): same normalised email, new idempotency key', async () => {
    await join.POST(post(form(startup())));
    await join.POST(post(form(startup({ email: 'MARTA.ROSSI@example.com', form: 'company', playerType: 'association', innovationObjective: 'open_innovation' }))));
    const [a, b] = rpcBody('crm_submit').map((x) => x.p);
    assert.equal(a.contact.email, b.contact.email);
    assert.notEqual(a.idempotency_key, b.idempotency_key);
    assert.equal(b.form_type, 'company_request');
    assert.equal(b.area, 'advisory');
    assert.deepEqual(b.data, { innovation_objective: 'open_innovation' }, 'company block; no startup answers for a non-startup');
  });

  // ── 3 & 4. Shared organisation, several areas (database side: supabase/tests/0010_crm.sql) ──
  await test('3/4. organisation and area travel with every request (deduplicated in the database)', async () => {
    await join.POST(post(form(startup({ email: 'luca@acme.it', form: 'invest', playerType: 'cvc', investmentTicket: '100k_500k', investmentStages: ['seed', 'series_a'] }))));
    const p = rpcBody('crm_submit')[0].p;
    assert.equal(p.organization.name, 'Acme');
    assert.equal(p.area, 'advisory');
    assert.deepEqual(p.data, { investment_ticket: '100k_500k', investment_stages: ['seed', 'series_a'] });
  });

  // ── 5. Form without newsletter ──
  await test('5. request without the newsletter box: no subscription, no confirmation email, no token', async () => {
    await join.POST(post(form(startup({ editorialInterests: ['advisory'] }))));
    const p = rpcBody('crm_submit')[0].p;
    assert.equal(p.newsletter.opt_in, false);
    assert.equal(p.newsletter.token_hash, null);
    assert.ok(!mails().some((m) => /Gocce di Innovazione/.test(m.subject)));
  });

  // ── 6. Form with newsletter ──
  await test('6. newsletter box ticked: pending + double opt-in email, interests recorded', async () => {
    crmSubmit = () => submitted({ newsletter: { id: 's1', action: 'send_confirmation' } });
    const r = await join.POST(post(form(startup({ newsletterOptIn: true, editorialInterests: ['advisory', 'giveback'] }))));
    assert.equal((await r.json()).newsletter, 'pending');
    const p = rpcBody('crm_submit')[0].p;
    assert.equal(p.newsletter.opt_in, true);
    assert.deepEqual(p.newsletter.interests, ['advisory', 'giveback']);
    assert.match(p.newsletter.token_hash, /^[0-9a-f]{64}$/);
    const confirm = mails().find((m) => /Gocce di Innovazione/.test(m.subject));
    assert.ok(confirm && to(confirm) === 'marta.rossi@example.com', 'confirmation email');
    assert.equal(external().length, 0, 'not added to any Brevo list');
  });
  await test('6b. newsletter box ticked by someone already subscribed: no second email', async () => {
    crmSubmit = () => submitted({ newsletter: { id: 's1', action: 'already_subscribed' } });
    const r = await join.POST(post(form(startup({ newsletterOptIn: true }))));
    assert.equal((await r.json()).newsletter, 'already');
    assert.ok(!mails().some((m) => /Gocce di Innovazione/.test(m.subject)));
  });

  // ── 7. Repeated request / double click ──
  await test('7. same request again (duplicate): success, no email, extra upload deleted', async () => {
    crmSubmit = () => submitted({ duplicate: true });
    const r = await join.POST(post(form(startup({ documentLink: '' }), { bytes: pdf(), name: 'deck.pdf', type: 'application/pdf' })));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).duplicate, true);
    assert.equal(mails().length, 0);
    assert.ok(calls.some((c) => c.url.includes('/storage/v1/object') && c.method === 'DELETE'), 'uploaded copy removed');
  });

  // ── 8. Invalid input, spam, unauthorised access ──
  await test('8a. missing or out-of-list values → 422 with field codes, nothing stored', async () => {
    const cases: [Record<string, unknown>, string, string][] = [
      [{ playerType: '' }, 'playerType', 'required'],
      [{ playerType: 'vc' }, 'playerType', 'invalid'], // not offered by the startup form
      [{ playerType: 'hacker' }, 'playerType', 'invalid'],
      [{ industry: 'weapons' }, 'industry', 'invalid'],
      [{ industry: '' }, 'industry', 'required'],
      [{ startupStage: '' }, 'startupStage', 'required'],
      [{ country: 'XX' }, 'country', 'invalid'],
      [{ email: 'nope' }, 'email', 'email'],
      [{ privacy: false }, 'privacy', 'consent'],
      [{ organizationName: '' }, 'organizationName', 'required'],
      [{ editorialInterests: ['rainforest_radar'] }, 'editorialInterests', 'invalid'],
    ];
    for (const [over, field, code] of cases) {
      const r = await join.POST(post(form(startup(over))));
      assert.equal(r.status, 422, field);
      assert.equal(((await r.json()) as { fields: Record<string, string> }).fields[field], code, field);
    }
    assert.equal(rpcBody('crm_submit').length, 0);
  });
  await test('8b. pitch without file or link → 422; renamed non-PDF → 422; no upload', async () => {
    let r = await join.POST(post(form(startup({ documentLink: '' }))));
    assert.equal(((await r.json()) as { fields: Record<string, string> }).fields.file, 'fileOrLink');
    r = await join.POST(post(form(startup({ documentLink: '' }), { bytes: new TextEncoder().encode('MZ not a pdf'), name: 'deck.pdf', type: 'application/pdf' })));
    assert.equal(((await r.json()) as { fields: Record<string, string> }).fields.file, 'fileType');
    assert.ok(!calls.some((c) => c.url.includes('/storage/')));
  });
  await test('8c. honeypot or too fast → fake success, nothing stored or sent', async () => {
    for (const over of [{ company_website_hp: 'http://spam' }, { elapsedMs: 200 }]) {
      const r = await join.POST(post(form(startup(over))));
      assert.equal(r.status, 200);
    }
    assert.equal(calls.length, 0);
  });
  await test('8d. cross-origin request → 403', async () => {
    const r = await join.POST(post(form(startup()), { origin: 'https://evil.example' }));
    assert.equal(r.status, 403);
    assert.equal(calls.length, 0);
  });
  await test('8e. per-address limit from the database → 429; database error → 500, no personal data in logs', async () => {
    crmSubmit = () => ok({ code: 'P0001', message: 'rate_limited' }, 400);
    assert.equal((await join.POST(post(form(startup())))).status, 429);
    crmSubmit = () => ok({ message: 'boom' }, 500);
    assert.equal((await join.POST(post(form(startup())))).status, 500);
    assert.ok(!logs.join(' ').includes('marta'), 'no email in the logs');
  });
  await test('8f. Brevo webhook is off: 404 without reading the body', async () => {
    const r = await webhook.POST(new Request('http://localhost/api/webhooks/brevo?secret=x', { method: 'POST', body: '{"event":"unsubscribed","email":"a@b.it"}' }));
    assert.equal(r.status, 404);
    assert.equal(calls.length, 0);
  });

  // ── Job application: outside the player model ──
  await test('job application: no organisation or player type stored, CV link required', async () => {
    const job = { ...startup({ form: 'job', jobArea: 'advisory', experience: '3_5', documentLink: 'https://cv.example/me.pdf', linkedin: 'linkedin.com/in/marta' }) };
    const r = await join.POST(post(form(job)));
    assert.equal(r.status, 200);
    const p = rpcBody('crm_submit')[0].p;
    assert.equal(p.form_type, 'job_application');
    assert.equal(p.area, null);
    assert.equal(p.organization, null);
    assert.equal(p.player_type, null);
    assert.deepEqual(p.data, { experience: '3_5', job_area: 'advisory', linkedin: 'https://linkedin.com/in/marta', city: 'Milano' });
  });
  await test('Giveback: individuals welcome (no organisation needed), contribution required', async () => {
    const gb = startup({ form: 'giveback', organizationName: '', playerType: '', contribution: 'mentoring' });
    assert.equal((await join.POST(post(form(gb)))).status, 200);
    assert.equal(rpcBody('crm_submit')[0].p.organization, null);
    const bad = await join.POST(post(form(startup({ form: 'giveback', organizationName: '', playerType: '' }))));
    assert.equal(((await bad.json()) as { fields: Record<string, string> }).fields.contribution, 'required');
  });

  // ── Schema details ──
  await test('schema: at most one required qualification per player group', () => {
    const base = { ...startup(), form: 'company', playerType: 'incubator_accelerator', startupStage: '', innovationObjective: 'tech_scouting' };
    const r = crmFormSchema.safeParse(base);
    assert.ok(!r.success);
    assert.deepEqual(Object.keys(crmFieldErrors(r.error)), ['supportedStages']);
    const good = crmFormSchema.parse({ ...base, supportedStages: ['seed'], servicesOffered: ['mentoring', 'mentoring'] });
    assert.deepEqual(submissionData(good), { supported_stages: ['seed'], services_offered: ['mentoring'], innovation_objective: 'tech_scouting' });
  });
  await test('schema: newsletter box defaults to off and source page loses query and fragment', () => {
    const r = crmFormSchema.parse({ ...startup(), newsletterOptIn: undefined });
    assert.equal(r.newsletterOptIn, false);
    assert.equal(r.sourcePage, '/it');
  });

  // ── Vocabulary shared with the database ──
  await test('taxonomy matches the lists checked by 0010_crm.sql', () => {
    const sql = readFileSync('supabase/migrations/0010_crm.sql', 'utf8');
    const list = (fn: string) => {
      const body = sql.match(new RegExp(`function public\\.${fn}\\(\\)[\\s\\S]*?array\\[([\\s\\S]*?)\\]`))![1];
      return [...body.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]);
    };
    assert.deepEqual(list('crm_areas'), taxonomy.AREAS);
    assert.deepEqual(list('crm_player_types'), taxonomy.PLAYER_TYPES);
    assert.deepEqual(list('crm_industries'), taxonomy.INDUSTRIES);
    const types = list('crm_form_types');
    for (const f of Object.values(FORMS)) assert.ok(types.includes(f.type), f.type);
    assert.equal(taxonomy.PLAYER_TYPES.length, 15);
    assert.equal(taxonomy.countryOptions('it')[0].value, 'IT');
  });

  // ── Prepared syncs: inactive ──
  await test('syncs are off: no network call even with credentials', async () => {
    const row = {
      supabase_contact_id: 'c1', email: 'a@b.it', firstname: 'A', lastname: null, player_type: 'startup', industry: 'fintech', country: 'IT',
      interest_giveback: true, interest_ovb: false, interest_advisory: true, source_form: 'rm_startup_v1', source_brand: 'rainmakers',
      newsletter_status: 'subscribed' as const, in_newsletter_list: true,
    };
    assert.equal(await sync.syncContactToBrevo(row), 'disabled');
    assert.equal(await sync.syncContactToAirtable({ id: 'c1', email: 'a@b.it', first_name: 'A', last_name: null, phone: null, job_title: null, player_type: null, first_form_id: 'x', created_at: '' }), 'disabled');
    assert.equal(calls.length, 0);
    assert.deepEqual(sync.toBrevoAttributes(row), {
      SUPABASE_CONTACT_ID: 'c1', FIRSTNAME: 'A', PLAYER_TYPE: 'startup', INDUSTRY: 'fintech', COUNTRY: 'IT',
      INTEREST_GIVEBACK: true, INTEREST_OVB: false, INTEREST_ADVISORY: true, SOURCE_FORM: 'rm_startup_v1', SOURCE_BRAND: 'rainmakers',
    });
    assert.equal(sync.brevoUnsubscribeEmail({ event: 'unsubscribed', email: ' A@B.it ' }), 'a@b.it');
    assert.equal(sync.brevoUnsubscribeEmail({ event: 'delivered', email: 'a@b.it' }), null);
  });

  console.error = origError;
  console.log(`\n${n} CRM tests passed`);
}

main().catch((e) => {
  console.error = origError;
  console.error(e);
  process.exit(1);
});
