/**
 * Exports all site copy (IT + EN side by side) as Markdown for review/approval.
 * Run: npm run copy:export   → docs/03-copy-deck.md
 */
import it from '../content/it';
import en from '../content/en';

const lines: string[] = [
  '# 03 — Copy deck IT / EN',
  '',
  '> Generated from `content/it.ts` and `content/en.ts` (`npm run copy:export`). Edit the source files, not this document.',
  '',
];
const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function walk(a: unknown, b: unknown, path: string[]) {
  if (typeof a === 'string') {
    lines.push(`| \`${path.slice(1).join('.')}\` | ${esc(a)} | ${esc(String(b ?? ''))} |`);
    return;
  }
  if (Array.isArray(a)) return a.forEach((v, i) => walk(v, (b as unknown[])?.[i], [...path, String(i)]));
  if (a && typeof a === 'object') {
    for (const k of Object.keys(a)) {
      if (path.length === 0) {
        if (k === 'locale') continue;
        lines.push('', `## ${k}`, '', '| Key | Italiano | English |', '|---|---|---|');
      }
      walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)?.[k], [...path, k]);
    }
  }
}
walk(it, en, []);
console.log(lines.join('\n'));
