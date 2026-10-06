/**
 * Verifies that IT and EN dictionaries are structurally identical and that every
 * form option uses the canonical values stored in the database (lib/options.ts).
 * Run: npm run check:content
 */
import it from '../content/it';
import en from '../content/en';
import { CHALLENGES, COMPANY_STAGES, INTERESTS, SOURCES } from '../lib/options';

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error('✗', msg);
};

function shape(value: unknown, path: string, other: unknown) {
  if (Array.isArray(value)) {
    if (!Array.isArray(other)) return fail(`${path}: array vs ${typeof other}`);
    // SEO keywords are tuned per language and may differ in number.
    if (path === 'dict.meta.keywords') return;
    if (value.length !== other.length) fail(`${path}: ${value.length} items (it) vs ${other.length} (en)`);
    value.forEach((v, i) => shape(v, `${path}[${i}]`, other[i]));
  } else if (value && typeof value === 'object') {
    if (!other || typeof other !== 'object') return fail(`${path}: object missing in en`);
    for (const k of new Set([...Object.keys(value), ...Object.keys(other)])) {
      if (!(k in (other as object))) fail(`${path}.${k}: missing in en`);
      else if (!(k in (value as object))) fail(`${path}.${k}: missing in it`);
      else shape((value as Record<string, unknown>)[k], `${path}.${k}`, (other as Record<string, unknown>)[k]);
    }
  } else if (typeof value === 'string' && !value.trim()) fail(`${path}: empty string`);
}
shape(it, 'dict', en);

for (const dict of [it, en]) {
  const check = (name: string, opts: { value: string }[], canonical: readonly string[]) => {
    const values = opts.map((o) => o.value).join(',');
    if (values !== canonical.join(',')) fail(`${dict.locale}.form.${name} values differ from lib/options.ts`);
  };
  check('stages', dict.form.stages, COMPANY_STAGES);
  check('challengeOptions', dict.form.challengeOptions, CHALLENGES);
  check('interestOptions', dict.form.interestOptions, INTERESTS);
  check('sourceOptions', dict.form.sourceOptions, SOURCES);
}

if (failures) {
  console.error(`\n${failures} content problem(s)`);
  process.exit(1);
}
console.log('✓ content: IT/EN in sync, form options match the database');
