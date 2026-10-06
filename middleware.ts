import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['it', 'en'];
const DEFAULT_LOCALE = 'it';

/**
 * Locale routing (PRD §48): every page lives under /it or /en.
 * "/" → /it, or /en when the browser does not prefer Italian.
 * Unprefixed paths are redirected to the same path under the chosen locale.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];
  if (LOCALES.includes(first)) return NextResponse.next();

  const locale = pickLocale(req.headers.get('accept-language'));

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set('Vary', 'Accept-Language');
  return res;
}

/** First supported language in the Accept-Language list (by q-value). No header (e.g. crawlers) → Italian. */
function pickLocale(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().toLowerCase().split(';q=');
      return { lang: tag.split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  // Non-Italian/English visitors get the international (English) version.
  return ranked.find((r) => LOCALES.includes(r.lang))?.lang ?? 'en';
}

export const config = {
  // Skip API, Next internals and any file with an extension (icons, images, robots.txt, llms.txt…)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
