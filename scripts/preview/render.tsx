// Preview-only: renders the real HomePage component to static HTML (no Next.js needed).
import { renderToString } from 'react-dom/server';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { HomePage } from '@/components/HomePage';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/content/types';

const out = process.argv[2];
const css = readFileSync(process.argv[3], 'utf8');
mkdirSync(out, { recursive: true });

for (const locale of ['it', 'en'] as Locale[]) {
  const dict = getDictionary(locale);
  const meta = buildMetadata(dict) as any;
  const body = renderToString(<HomePage dict={dict} locale={locale} />);
  const alt = meta.alternates.languages;
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title><meta name="description" content="${meta.description}">
<link rel="canonical" href="${meta.alternates.canonical}">
${Object.entries(alt).map(([k, v]) => `<link rel="alternate" hreflang="${k}" href="${v}">`).join('')}
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
<script>(function(d){d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.remove('js')},4000)})(document.documentElement)</script>
<style>${css}</style></head><body><div id="root" data-locale="${locale}">${body}</div><script src="/client.js"></script></body></html>`;
  mkdirSync(`${out}/${locale}`, { recursive: true });
  writeFileSync(`${out}/${locale}/index.html`, html);
}
console.log('rendered');
