import 'server-only';
import { communitiesFallback, type Community, type CommunityStatus } from '@/content/shared';
import { authHeaders, supabaseConfig } from './rest';

interface CommunityRow {
  slug: string;
  name_it: string;
  name_en: string;
  description_it: string | null;
  description_en: string | null;
  target: string | null;
  category: string | null;
  whatsapp_url: string | null;
  status: CommunityStatus;
  capacity: number | null;
}

const fromRow = (r: CommunityRow): Community => ({
  slug: r.slug,
  name: { it: r.name_it, en: r.name_en },
  description: { it: r.description_it ?? '', en: r.description_en ?? '' },
  target: r.target,
  category: r.category,
  whatsappUrl: r.whatsapp_url,
  status: r.status,
  capacity: r.capacity,
});

/**
 * Communities shown on the page (PRD §16–17): read from Supabase, refreshed every 5 minutes (ISR).
 * Falls back to content/shared.ts when Supabase is not configured, unreachable or still empty.
 */
export async function getCommunities(): Promise<{ items: Community[]; source: 'supabase' | 'fallback' }> {
  const cfg = supabaseConfig('public');
  if (!cfg) return { items: communitiesFallback, source: 'fallback' };
  try {
    const query =
      'select=slug,name_it,name_en,description_it,description_en,target,category,whatsapp_url,status,capacity' +
      '&status=in.(active,full,coming_soon)&order=sort_order.asc,created_at.asc';
    const res = await fetch(`${cfg.url}/rest/v1/communities?${query}`, {
      headers: authHeaders(cfg.key),
      next: { revalidate: 300, tags: ['communities'] },
    } as RequestInit);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as CommunityRow[];
    return rows.length ? { items: rows.map(fromRow), source: 'supabase' } : { items: communitiesFallback, source: 'fallback' };
  } catch (err) {
    console.error('[communities] falling back to static list:', err);
    return { items: communitiesFallback, source: 'fallback' };
  }
}
