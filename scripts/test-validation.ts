/** Unit tests for the shared lead schema. Run: npx tsx scripts/test-validation.ts */
import assert from 'node:assert/strict';
import { leadSchema, toFieldErrors } from '../lib/validation';

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
test('over-long text → "tooLong"', () => assert.equal(fails({ ...valid, interest: 'x'.repeat(1001) }).interest, 'tooLong'));
test('all six profile types accepted', () => {
  for (const p of ['founder', 'startup', 'investor', 'corporate', 'innovation_professional', 'other']) assert.ok(leadSchema.safeParse({ ...valid, profileType: p }).success, p);
});
console.log(`\n${n} validation tests passed`);
