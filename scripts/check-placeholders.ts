/**
 * Lists every placeholder (PRD §53) and every fact that is not VERIFIED, so nothing
 * unconfirmed ships by accident. Run: npm run check:placeholders
 * With STRICT_CONTENT=1 the script exits with an error when anything is left (use in CI before launch).
 */
import it from '../content/it';
import en from '../content/en';
import { isPlaceholder } from '../content/governance';
import { brand, communitiesFallback, facts } from '../content/shared';
import { tribe } from '../content/data/tribe';

const found: string[] = [];

function walk(value: unknown, path: string) {
  if (typeof value === 'string') {
    if (isPlaceholder(value)) found.push(`${path}: ${value}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
}
walk(it, 'it');
walk(en, 'en');

for (const [k, f] of Object.entries(facts)) if (f.status !== 'VERIFIED') found.push(`facts.${k}: ${f.status}${f.note ? ` — ${f.note}` : ''}`);
for (const d of [it, en])
  d.proof.testimonials.forEach((t, i) => t.status !== 'VERIFIED' && found.push(`${d.locale}.proof.testimonials[${i}] (${t.company}): ${t.status} — hidden until verified`));
communitiesFallback.forEach((c) => {
  if (!c.whatsappUrl) found.push(`communitiesFallback.${c.slug}: [WHATSAPP COMMUNITY LINK TO BE PROVIDED]`);
  if (isPlaceholder(c.name.it)) found.push(`communitiesFallback.${c.slug}: name to be provided`);
});
tribe.forEach((c) => isPlaceholder(c.description.it) && found.push(`tribe.${c.slug}: description to be provided`));
if (!brand.available) found.push('brand: official logo files not provided yet (provisional wordmark in use)');

if (!found.length) {
  console.log('✓ no placeholders or unverified facts left');
} else {
  console.log(`${found.length} item(s) to complete or verify before launch:\n`);
  for (const f of found) console.log(' •', f);
  if (process.env.STRICT_CONTENT === '1') process.exit(1);
}
