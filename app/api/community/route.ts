import { communitySchema, toFieldErrors } from '@/lib/validation';
import { submitCommunityRequest } from '@/lib/supabase/leads';
import { getCommunities } from '@/lib/supabase/communities';
import { isPlaceholder } from '@/content/governance';
import { guard, isBot, json, readJson } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 4 * 1024;

/**
 * "Entra su WhatsApp" (PRD §10.2): stores the request in community_requests, then returns the
 * community's WhatsApp link. Joining a community is not a newsletter subscription.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'community');
  if (blocked) return blocked;

  const read = await readJson(req, MAX_BODY_BYTES);
  if (!read.ok) return read.response;
  const body = read.body as { website_hp?: unknown; elapsedMs?: unknown };
  if (isBot(body?.website_hp, body?.elapsedMs)) return json({ ok: true });

  const parsed = communitySchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'validation', fields: toFieldErrors(parsed.error) }, 422);

  // Only communities currently listed as open, with a confirmed WhatsApp link
  const { items } = await getCommunities();
  const community = items.find((c) => c.slug === parsed.data.community && c.status === 'active' && c.whatsappUrl && !isPlaceholder(c.whatsappUrl));
  if (!community?.whatsappUrl) return json({ ok: false, error: 'validation', fields: { community: 'required' } }, 422);

  const result = await submitCommunityRequest(parsed.data);
  if (!result.ok) return json({ ok: false, error: result.reason }, result.reason === 'rate_limited' ? 429 : 500);
  return json({ ok: true, whatsappUrl: community.whatsappUrl });
}

export function GET() {
  return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
