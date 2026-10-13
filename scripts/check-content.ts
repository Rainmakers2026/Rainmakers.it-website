/**
 * Verifies that IT and EN dictionaries are structurally identical and that form options
 * use the canonical values stored in the database (lib/options.ts).
 * Run: npm run check:content
 */
import it from '../content/it';
import en from '../content/en';
import { PROFILE_TYPES } from '../lib/options';

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error('✗', msg);
};

// Keys whose array length may legitimately differ between languages
const FREE_LENGTH = new Set(['dict.meta.keywords']);

function shape(value: unknown, path: string, other: unknown) {
  if (Array.isArray(value)) {
    if (!Array.isArray(other)) return fail(`${path}: array vs ${typeof other}`);
    if (FREE_LENGTH.has(path)) return;
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
  const values = dict.connect.form.profiles.map((o) => o.value).join(',');
  if (values !== PROFILE_TYPES.join(',')) fail(`${dict.locale}.connect.form.profiles differ from lib/options.ts`);
  if (dict.how.nodes.length !== 6) fail(`${dict.locale}.how.nodes must list the 6 network elements (PRD §8.2)`);
}

if (failures) {
  console.error(`\n${failures} content problem(s)`);
  process.exit(1);
}
console.log('✓ content: IT/EN in sync, form options match the database');
