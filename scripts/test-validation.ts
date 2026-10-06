/** Unit tests for the shared lead schema. Run: npx tsx scripts/test-validation.ts */
import assert from 'node:assert/strict';
import { leadSchema, toFieldErrors } from '../lib/validation';

const valid = {
  intent: 'join',
  locale: 'it',
  firstName: ' Giulia ',
  lastName: 'Rossi',
  email: 'Giulia@Example.COM',
  company: 'Acme',
  role: 'CEO',
  companyStage: 'seed',
  consent: true,
};

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('✓', name);
};

test('valid minimal lead passes and is normalised', () => {
  const r = leadSchema.parse(valid);
  assert.equal(r.firstName, 'Giulia');
  assert.equal(r.email, 'giulia@example.com');
  assert.deepEqual(r.challenges, []);
});
test('missing required fields → "required"', () => {
  const r = leadSchema.safeParse({ intent: 'join', locale: 'it', consent: true });
  if (r.success) throw new Error('expected validation failure');
  const e = toFieldErrors(r.error);
  for (const f of ['firstName', 'lastName', 'email', 'company', 'role', 'companyStage']) assert.equal(e[f], 'required', f);
});
test('invalid email → "email"', () => {
  const r = leadSchema.safeParse({ ...valid, email: 'nope' });
  if (r.success) throw new Error('expected validation failure');
  assert.equal(toFieldErrors(r.error).email, 'email');
});
test('consent must be true', () => {
  const r = leadSchema.safeParse({ ...valid, consent: false });
  if (r.success) throw new Error('expected validation failure');
  assert.equal(toFieldErrors(r.error).consent, 'consent');
});
test('website without protocol is normalised', () => {
  assert.equal(leadSchema.parse({ ...valid, website: 'acme.it' }).website, 'https://acme.it/');
});
test('non-LinkedIn URL is rejected', () => {
  const r = leadSchema.safeParse({ ...valid, linkedin: 'https://example.com/me' });
  if (r.success) throw new Error('expected validation failure');
  assert.equal(toFieldErrors(r.error).linkedin, 'linkedin');
});
test('LinkedIn URL accepted', () => {
  assert.ok(leadSchema.parse({ ...valid, linkedin: 'linkedin.com/in/giulia' }).linkedin?.startsWith('https://linkedin.com'));
});
test('contact intent requires a message', () => {
  const r = leadSchema.safeParse({ ...valid, intent: 'contact' });
  if (r.success) throw new Error('expected validation failure');
  assert.equal(toFieldErrors(r.error).message, 'required');
  assert.ok(leadSchema.safeParse({ ...valid, intent: 'contact', message: 'Ciao' }).success);
});
test('unknown option values are rejected', () => {
  assert.ok(!leadSchema.safeParse({ ...valid, challenges: ['hacking'] }).success);
  assert.ok(!leadSchema.safeParse({ ...valid, companyStage: 'unicorn' }).success);
});
test('over-long text → "tooLong"', () => {
  const r = leadSchema.safeParse({ ...valid, company: 'x'.repeat(121) });
  if (r.success) throw new Error('expected validation failure');
  assert.equal(toFieldErrors(r.error).company, 'tooLong');
});
test('empty source becomes undefined', () => {
  assert.equal(leadSchema.parse({ ...valid, source: '' }).source, undefined);
});
console.log(`\n${n} validation tests passed`);
