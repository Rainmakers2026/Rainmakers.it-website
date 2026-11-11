/**
 * Visible homepage word count per section (PRD §5.1), used to document the copy reduction.
 * Renders the real HomePage and counts text inside <main> that a visitor sees on load.
 * Excluded, as the PRD requires: navigation, footer, form fields and consent text,
 * FAQ answers (collapsed), screen-reader-only text, hidden and aria-hidden elements.
 * Run: npm run count:words
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
import { ImageConfigContext } from 'next/dist/shared/lib/image-config-context.shared-runtime';
import nextConfig from '../next.config';
import { HomePage } from '../components/HomePage';
import { getDictionary } from '../lib/i18n';
import type { Locale } from '../content/types';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');
const words = (s: string) => (decode(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%+\-]*/gu) || []).length;

interface Frame {
  tag: string;
  skip: boolean;
}

function count(html: string) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g;
  const stack: Frame[] = [];
  const perSection: Record<string, number> = {};
  let inMain = false;
  let section = 'main';
  let total = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[5] !== undefined) {
      if (!inMain || stack.some((f) => f.skip)) continue;
      const n = words(m[5]);
      total += n;
      perSection[section] = (perSection[section] || 0) + n;
      continue;
    }
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    if (m[1]) {
      if (tag === 'main') inMain = false;
      while (stack.length) if (stack.pop()!.tag === tag) break;
      continue;
    }
    if (tag === 'main') inMain = true;
    if (inMain && tag === 'section' && !stack.some((f) => f.tag === 'section')) {
      section = /id="([^"]+)"/.exec(attrs)?.[1] || /class="([^"\s]+)/.exec(attrs)?.[1] || 'section';
    }
    if (VOID.has(tag) || m[4]) continue;
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const skip =
      tag === 'script' ||
      tag === 'style' ||
      tag === 'form' ||
      /\shidden(=|\s|$)/.test(attrs) ||
      /aria-hidden="true"/.test(attrs) ||
      /\b(sr-only|faq__a)\b/.test(cls);
    stack.push({ tag, skip });
  }
  return { total, perSection };
}

// Outside Next.js, next/image needs the project's image config (remote video thumbnail) from context.
const imageConfig = { ...imageConfigDefault, ...nextConfig.images };

const results = (['it', 'en'] as Locale[]).map((locale) => {
  const page = createElement(HomePage, { dict: getDictionary(locale), locale });
  const html = renderToStaticMarkup(createElement(ImageConfigContext.Provider, { value: imageConfig }, page));
  return { locale, ...count(html) };
});

for (const r of results) {
  console.log(`\n${r.locale.toUpperCase()} — visible words in <main> (PRD §5.1 exclusions): ${r.total}`);
  for (const [k, v] of Object.entries(r.perSection)) console.log(`  ${k.padEnd(18)} ${v}`);
}
if (process.argv.includes('--json')) console.log(JSON.stringify(results.map(({ locale, total }) => ({ locale, total }))));
