import { UTM_KEYS } from '@/lib/options';

/**
 * Campaign parameters of the visit (browser only): the UTM of the current address, else those the visitor arrived
 * with earlier in this session (kept in sessionStorage on arrival). The server records them per request and keeps the
 * very first ones on the contact. Values are only labels: the server validates them and never trusts them for
 * security or consent decisions.
 */
const KEY = 'rm_utm';

export function visitUtm(): Record<string, string> {
  const fromUrl: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) fromUrl[k] = v.slice(0, 200);
  }
  try {
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem(KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const stored = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(stored).filter(([k, v]) => (UTM_KEYS as readonly string[]).includes(k) && typeof v === 'string').map(([k, v]) => [k, String(v).slice(0, 200)]),
    );
  } catch {
    return fromUrl;
  }
}

/** Path of the current page, without query string or fragment */
export const currentPage = () => window.location.pathname.slice(0, 300);
