/** Unit tests for the shared lead schema. Run: npx tsx scripts/test-validation.ts */
import assert from 'node:assert/strict';
import { communitySchema, contactSchema, leadSchema, toFieldErrors } from '../lib/validation';
import { checkUploadMeta, isPdfSignature, safeFileName, storagePath, MAX_UPLOAD_BYTES } from '../lib/uploads';

const valid = {
  locale: 'it',
  firstName: ' Giulia ',
  lastName: 'Rossi',
  email: 'Giulia@Example.COM',
  company: 'Acme',
  role: 'CEO',
  profileType: 'founder',
  consent: true,
};

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('✓', name);
};
const fails = (input: unknown) => {
  const r = leadSchema.safeParse(input);
  if (r.success) throw new Error('expected validation failure');
  return toFieldErrors(r.error);
};

test('valid minimal lead passes and is normalised', () => {
  const r = leadSchema.parse(valid);
  assert.equal(r.firstName, 'Giulia');
  assert.equal(r.email, 'giulia@example.com');
  assert.equal(r.link, undefined);
});
test('missing required fields → "required"', () => {
  const e = fails({ locale: 'it', consent: true });
  for (const f of ['firstName', 'lastName', 'email', 'company', 'role', 'profileType']) assert.equal(e[f], 'required', f);
});
test('invalid email → "email"', () => assert.equal(fails({ ...valid, email: 'nope' }).email, 'email'));
test('consent must be true', () => assert.equal(fails({ ...valid, consent: false }).consent, 'consent'));
test('unknown profile type is rejected', () => assert.equal(fails({ ...valid, profileType: 'unicorn' }).profileType, 'required'));
test('website without protocol is normalised', () => assert.equal(leadSchema.parse({ ...valid, link: 'acme.it' }).link, 'https://acme.it/'));
test('LinkedIn URL accepted', () => assert.ok(leadSchema.parse({ ...valid, link: 'linkedin.com/in/giulia' }).link?.startsWith('https://linkedin.com')));
test('invalid URL → "url"', () => assert.equal(fails({ ...valid, link: 'not a url' }).link, 'url'));
test('interest is optional and trimmed', () => {
  assert.equal(leadSchema.parse({ ...valid, interest: '   ' }).interest, undefined);
  assert.equal(leadSchema.parse({ ...valid, interest: ' partner ' }).interest, 'partner');
});
test('pitch application fields are validated and retained', () => {
  const application = {
    startupName: 'Acme',
    companyIncorporated: 'yes',
    incorporationYear: '2024',
    cityProvince: 'Milano',
    sector: 'Cleantech',
    websites: ['https://acme.example'],
    serviceInterest: 'fundraising',
  };
  const parsed = leadSchema.parse({ ...valid, profileType: 'startup', application, submissionType: 'pitch' });
  assert.deepEqual(parsed.application, application);
  assert.equal(parsed.submissionType, 'pitch');
});
test('invalid pitch website is rejected', () => {
  const e = fails({
    ...valid,
    profileType: 'startup',
    application: {
      startupName: 'Acme',
      companyIncorporated: 'no',
      cityProvince: 'Milano',
      sector: 'Cleantech',
      websites: ['not a URL'],
      serviceInterest: 'fundraising',
    },
  });
  assert.equal(e.application, 'url');
});
test('over-long text → "tooLong"', () => assert.equal(fails({ ...valid, interest: 'x'.repeat(1001) }).interest, 'tooLong'));
test('all six profile types accepted', () => {
  for (const p of ['founder', 'startup', 'investor', 'corporate', 'innovation_professional', 'other']) assert.ok(leadSchema.safeParse({ ...valid, profileType: p }).success, p);
});
// ── Phase 4: per-form schemas and upload rules ──
const key = '7f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f';
const application = { startupName: 'Acme', companyIncorporated: 'no', cityProvince: 'Milano', sector: 'Cleantech', serviceInterest: 'fundraising' };

test('contact form requires an idempotency key (UUID)', () => {
  assert.equal(contactSchema.safeParse(valid).success, false);
  assert.equal(contactSchema.safeParse({ ...valid, idempotencyKey: 'abc' }).success, false);
  assert.ok(contactSchema.safeParse({ ...valid, idempotencyKey: key }).success);
});
test('contact form drops Join-only fields', () => {
  const r = contactSchema.parse({ ...valid, idempotencyKey: key, submissionType: 'pitch', application });
  assert.equal((r as Record<string, unknown>).submissionType, undefined);
  assert.equal((r as Record<string, unknown>).application, undefined);
});
// The "Come vuoi iniziare?" forms moved to the CRM schema on 2026-11-11: scripts/test-crm.ts
test('community: minimal valid request', () => {
  assert.ok(communitySchema.safeParse({ locale: 'en', firstName: 'Ann', email: 'ann@example.com', community: 'italian-rainforest', consent: true }).success);
});
test('community: bad slug, email or missing consent rejected', () => {
  const base = { locale: 'it', firstName: 'Ann', email: 'ann@example.com', community: 'italian-rainforest', consent: true };
  assert.equal(communitySchema.safeParse({ ...base, community: '../etc' }).success, false);
  assert.equal(communitySchema.safeParse({ ...base, email: 'x' }).success, false);
  assert.equal(communitySchema.safeParse({ ...base, consent: false }).success, false);
});
test('upload: PDF metadata accepted, others rejected', () => {
  assert.equal(checkUploadMeta({ name: 'deck.pdf', type: 'application/pdf', size: 1000 }), null);
  assert.equal(checkUploadMeta({ name: 'DECK.PDF', type: '', size: 1000 }), null);
  assert.equal(checkUploadMeta({ name: 'deck.docx', type: 'application/pdf', size: 1000 }), 'fileType');
  assert.equal(checkUploadMeta({ name: 'deck.pdf', type: 'image/png', size: 1000 }), 'fileType');
  assert.equal(checkUploadMeta({ name: 'deck.pdf', type: 'application/pdf', size: 0 }), 'fileType');
  assert.equal(checkUploadMeta({ name: 'deck.pdf', type: 'application/pdf', size: MAX_UPLOAD_BYTES + 1 }), 'fileTooLarge');
});
test('upload: PDF signature check', () => {
  assert.ok(isPdfSignature(new TextEncoder().encode('%PDF-1.7\n')));
  assert.equal(isPdfSignature(new TextEncoder().encode('MZ\x90\x00')), false);
  assert.equal(isPdfSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), false);
});
test('upload: storage path is unpredictable and matches the DB constraint', () => {
  const path = storagePath('cv', key, new Date(Date.UTC(2026, 9, 12)));
  assert.equal(path, `cv/2026/10/${key}.pdf`);
  assert.ok(/^cv\/[0-9]{4}\/[0-9]{2}\/[0-9a-f-]{36}\.pdf$/.test(path));
});
test('upload: original file name is sanitised', () => {
  assert.equal(safeFileName('../../etc/passwd.pdf'), 'etc_passwd.pdf');
  assert.equal(safeFileName('Pitch Déck <script>.pdf'), 'Pitch_De_ck_script_.pdf');
  assert.ok(safeFileName('x'.repeat(300) + '.pdf').length <= 120);
});
console.log(`\n${n} validation tests passed`);
