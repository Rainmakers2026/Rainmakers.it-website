# Rainmakers.it — v1 (one-page, IT/EN)

Lead-generation one-page for Rainmakers, built from PRD v1.0.
Next.js 15 (App Router) · React 19 · TypeScript · Supabase · Vercel.

```
ATTRACT → EXPLAIN → ENGAGE → CONVERT → CONNECT
```

## Documents

| File | What it is |
|---|---|
| `docs/01-content-audit.md` | Old site / Nuvolab / Rainforest audit: KEEP · REWRITE · REPURPOSE · REMOVE · VERIFY |
| `docs/02-prd-review.md` | Decisions taken where the PRD was open, and the questions still to answer |
| `docs/03-copy-deck.md` | All copy IT/EN side by side (generated: `npm run copy:export`) |

## Quick start

```bash
npm install
cp .env.example .env.local      # leave Supabase empty to use mock mode locally
npm run dev                     # http://localhost:3000 → redirects to /it
npm test                        # validation unit tests + IT/EN content parity
npm run build
```

Without `SUPABASE_URL`, `/api/lead` runs in **mock mode** in development (logs the lead, returns success).

## Supabase

1. Create a project (EU region, e.g. Frankfurt, for GDPR).
2. Run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. In Vercel set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API; a new-style `sb_secret_…` key also works). **Never** expose it with `NEXT_PUBLIC_`.

Data model: `leads` (upsert by email), `community_requests`, `contact_requests`, `lead_events` (one row per submission, UTM + rate-limit). RLS is on everywhere with no public policies: the site writes only through `submit_lead()` from the server. The team reviews data in the Supabase dashboard; `v_pending_community_requests` lists the access requests to approve.

## Deploy on Vercel

1. Import the repo → framework auto-detected (Next.js). Region `fra1` is set in `vercel.json`.
2. Env vars: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Enable **Web Analytics** in the Vercel project (cookieless; custom events need a plan that supports them).
4. Point `www.rainmakers.it` to Vercel; redirect the apex domain to `www`.

## Where to change things

| To change… | Edit |
|---|---|
| Any text (IT/EN) | `content/it.ts`, `content/en.ts` — typed by `content/types.ts`, so the two languages can't drift |
| Facts, links, Rainforest stats, Tribe, legal entity | `content/shared.ts` (everything unverified is tagged `TODO_CONFIRM`) |
| Form options | `lib/options.ts` + labels in content files (`npm run check:content` checks they match) |
| Colours, type, spacing | tokens at the top of `app/globals.css` |
| Section order | `components/HomePage.tsx` |
| Analytics events | `lib/analytics.ts` (catalogue) + `data-track` attributes on CTAs |

## Architecture

```
app/
  [locale]/layout.tsx        html lang, Roboto (next/font), metadata, Vercel Analytics
  [locale]/page.tsx          the one-page
  [locale]/privacy/page.tsx  privacy policy (DRAFT, noindex until validated)
  [locale]/opengraph-image   localized OG image generated at build time
  api/lead/route.ts          server validation, anti-spam, rate-limit, Supabase RPC
  robots.ts · sitemap.ts · icon.svg
middleware.ts                / → /it (or /en by Accept-Language)
components/
  sections/*                 one component per narrative section (server components)
  Header · LeadForm · ClientEffects · StickyCta · visuals/HeroNetwork   (client islands)
lib/                         validation (zod, shared client/server), seo/JSON-LD, analytics, i18n
content/                     all copy and facts
supabase/migrations/         schema + RLS + submit_lead()
public/llms.txt              plain-language summary for generative engines (GEO)
```

Only five small client islands ship JavaScript; everything else is server-rendered HTML. Client components receive only the copy slice they render (`lib/client-copy.ts`).

### SEO / GEO
- Localized metadata, canonical, `hreflang` (it, en, x-default), Open Graph/Twitter per locale
- JSON-LD graph: `Organization`, `Dataset` (Italian Rainforest, `owns` relation), `WebSite`, `WebPage`, `FAQPage`
- Explicit, quotable definitions in copy (About section, FAQ) and `public/llms.txt`

### Analytics events (PRD §40)
`page_view`, `hero_cta_click`, `join_cta_click`, `rainforest_cta_click`, `community_cta_click`, `contact_cta_click`, `lead_form_start`, `lead_form_submit`, `lead_form_error`, `community_request`, `whatsapp_click`, `faq_open`, `language_switch`, `scroll_25/50/75/90`. Sent to Vercel Analytics and pushed to `window.dataLayer` (ready for GTM — add a consent banner first if you add cookie-based tools).

### Security
Server-side zod validation · honeypot + minimum fill time · per-IP limit (in-memory) + per-email limit (SQL) · same-origin check · body size cap · CSP, HSTS, frame-deny headers · RLS with no public access · service key server-only (`server-only` import guard).

### Accessibility
Semantic landmarks, one `h1`, ordered headings, skip link, visible focus, keyboard-trapped mobile menu with Escape, labelled form fields with `aria-invalid`/`aria-describedby`, focusable error summary, live thank-you region, native `<details>` FAQ, `prefers-reduced-motion` respected everywhere (hero renders a static network, reveals and marquee disabled), content visible without JavaScript.

## Go-live checklist

- [ ] Replace provisional logo & favicon (`public/brand/README.md`, `components/Logo.tsx`, `app/icon.svg`)
- [ ] Resolve every `TODO_CONFIRM` (`grep -rn TODO_CONFIRM`) — legal entity, contact email, social profiles, Tribe list
- [ ] Re-confirm the 7 testimonials with the people quoted
- [ ] Validate the privacy policy with legal/DPO, then remove the draft banner and `noindex`
- [ ] Decide the community onboarding process and names (docs/02 §B)
- [ ] Update Rainforest stats in `content/shared.ts` (`asOf` date) at each release
- [ ] Run Lighthouse on the Vercel preview (target Performance > 90)
- [ ] Submit `sitemap.xml` to Google Search Console

## Local preview without Next.js

`scripts/preview/` renders the real components with esbuild + react-dom (used during development where the npm registry was unavailable). Not needed for normal work: use `npm run dev`.
