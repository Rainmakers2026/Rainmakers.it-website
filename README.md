# Rainmakers.it — v2 (one-page, IT/EN)

Gateway to the Rainmakers ecosystem, built from PRD v2 ("Website Redesign & Lead Generation Platform").
Next.js 15 (App Router) · React 19 · TypeScript · Supabase · Vercel.

```
RAINMAKERS → DISCOVER → ITALIAN RAINFOREST → FIND YOUR PLACE → JOIN THE COMMUNITY → CONNECT → GROW
```

CTA system: **Explore the ecosystem** (→ Italian Rainforest) · **Join the community** (→ community list) · **Connect with Rainmakers** (→ form).

## Documents

| File | What it is |
|---|---|
| `docs/00-technical-spec.md` | **Technical spec for PRD v2** (architecture, components, data model, routing, Supabase, analytics, SEO) and v1→v2 differences |
| `docs/04-company-overview.md` | How the May 2025 company overview (Tribe, advisory, business units, founder) was integrated |
| `docs/01-content-audit.md` | Old site / Nuvolab / Rainforest audit: KEEP · REWRITE · REPURPOSE · REMOVE · VERIFY |
| `docs/02-prd-review.md` | Decisions taken where the PRD was open, and the questions still to answer |
| `docs/03-copy-deck.md` | All copy IT/EN side by side (generated: `npm run copy:export`) |
| `docs/crm/README.md` | CRM "Rainmakers OS": forms → Supabase, Brevo and Airtable mapping, env vars, deploy, checklist (IT) |

## Quick start

```bash
npm install
cp .env.example .env.local      # leave Supabase empty to use mock mode locally
npm run dev                     # http://localhost:3000 → redirects to /it
npm test                        # validation tests + IT/EN parity + placeholder report
npm run check:placeholders      # everything still TO VERIFY / PLACEHOLDER (STRICT_CONTENT=1 fails CI)
npm run build
```

Without `SUPABASE_URL`, `/api/lead` runs in **mock mode** in development (logs the lead, returns success).

## Supabase

Supabase is empty: the migration creates structure only, never data.

1. Create a project (EU region, e.g. Frankfurt, for GDPR).
2. Run `supabase/migrations/0001_init.sql` and `0002_lead_application.sql` (SQL editor or `supabase db push`).
3. Add real communities to `communities` (template in `supabase/seed.example.sql`). The page re-reads them every 5 minutes; while the table is empty it shows the fallback list in `content/shared.ts`.
4. In Vercel set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (writes) and `SUPABASE_ANON_KEY` (reads). Never expose them with `NEXT_PUBLIC_`.

| Table | Status | Access |
|---|---|---|
| `leads` (+ `lead_events`) | MVP | Write only via `submit_lead()` from the server; no public access |
| `communities` | MVP | Public read of `active` / `full` / `coming_soon` rows (RLS) |
| `content`, `ecosystem_links` | Future | Public read of `published` rows only |
| `newsletter_subscribers` | Future | No public access |

### CRM "Rainmakers OS" (2026-11-11)

Every form feeds one CRM in Supabase (`supabase/migrations/0010_crm.sql`): contacts deduplicated by email, organisations by website domain or name, one `form_submissions` row per request with its source, UTM and privacy version, editorial interests, consent events, and the only newsletter, **Gocce di Innovazione**, with double opt-in and a signed unsubscribe link. The forms share one schema (`lib/crm/schema.ts`) and one vocabulary (`lib/crm/taxonomy.ts`, checked against the SQL by `npm run test:crm`).

Transactional emails stay on: the double opt-in confirmation, the welcome, the acknowledgement to the visitor and the team notification (the four "Come vuoi iniziare?" forms to `JOIN_NOTIFY_EMAIL`, default info@rainmakers.it; reviews to `FORMS_NOTIFY_EMAIL`; confirmed subscriptions to `NEWSLETTER_NOTIFY_EMAIL`, both default tools@nuvolab.com). The syncs to Brevo lists and Airtable are **prepared but off** (`lib/crm/sync.ts`): every change is queued in `external_sync_status` and nothing leaves the server until `CRM_SYNC_BREVO_ENABLED` / `CRM_SYNC_AIRTABLE_ENABLED` are set with their credentials.

Setup, field mapping (Supabase → Brevo, Supabase → Airtable), environment variables, deploy steps and the manual checklist: **`docs/crm/README.md`**. The tables of 0001–0009 are kept untouched (read-only for the site). The "Contatti" mini form doesn't go through the server: it opens an email to info@nuvolab.com (`content/shared.ts → facts.otherInquiriesEmail`).

## Deploy on Vercel

1. Import the repo → framework auto-detected (Next.js). Region `fra1` is set in `vercel.json`.
2. Env vars: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, the Brevo sender variables, `NEWSLETTER_LINK_SECRET` and `CRON_SECRET` (full list in `.env.example` and `docs/crm/README.md`). Apply `supabase/migrations/0010_crm.sql` before deploying this version: the forms write through its functions.
3. Enable **Web Analytics** in the Vercel project (cookieless; custom events need a plan that supports them).
4. Point `www.rainmakers.it` to Vercel; redirect the apex domain to `www`.

## Where to change things

| To change… | Edit |
|---|---|
| Any text (IT/EN) | `content/it/<section>.ts`, `content/en/<section>.ts` — typed by `content/types.ts`, so the two languages can't drift |
| Facts, links, Rainforest stats, logos, fallback communities | `content/shared.ts` — each fact has a status: VERIFIED / TO_VERIFY / PLACEHOLDER (`content/governance.ts`) |
| Testimonials | `content/*/proof.ts` — set `status: 'VERIFIED'` once authorised; the section appears automatically |
| Communities | Supabase `communities` table |
| Tribe companies / advisory projects | `content/data/tribe.ts`, `content/data/advisory.ts` |
| Profile options | `lib/options.ts` + labels in `content/*/connect.ts` (`npm run check:content` checks they match) |
| Colours, type, spacing | tokens at the top of `app/globals.css` |
| Section order | `components/HomePage.tsx` |
| Analytics events | `lib/analytics.ts` (catalogue) + `data-track` attributes on CTAs |

## Architecture

See `docs/00-technical-spec.md` for the full spec. In short:

```
app/[locale]/page.tsx            one-page (SSG + ISR 5 min for communities)
app/[locale]/privacy|cookie      legal drafts (noindex)
app/api/lead/route.ts            server validation, anti-spam, rate-limit → Supabase RPC
components/sections/*            Hero, Why, About, Access, Rainforest, Network, HowItWorks, Audience, Model, Proof, Community, Connect, TrackRecord, Faq, FinalCta
components/explorer/Explorer.tsx searchable, filterable, expandable directory cards (Tribe, advisory)
content/data/*                   tribe.ts (29 companies), advisory.ts (28 projects)
components/visuals/*             HeroNetwork (canvas), NetworkMap (interactive), RainforestStats
lib/supabase/*                   leads (write) and communities (read, with fallback)
content/{it,en}/*                one file per section
```

### SEO / GEO
- Localized metadata, canonical, `hreflang` (it, en, x-default), Open Graph/Twitter per locale
- JSON-LD graph: `Organization`, `Dataset` (Italian Rainforest, `owns` relation), `WebSite`, `WebPage`, `FAQPage`
- Explicit, quotable definitions in copy (About section, FAQ) and `public/llms.txt`

### Analytics events (PRD §40)
`page_view`, `language_switch`, `hero_cta_click`, `rainforest_cta_click`, `community_cta_click`, `contact_cta_click`, `lead_form_start`, `lead_form_submit`, `lead_form_error`, `whatsapp_click` (with `community`), `faq_open`, `scroll_depth` (with `percent`). Sent to Vercel Analytics and pushed to `window.dataLayer` (ready for GTM — add a consent banner first if you add cookie-based tools).

### Security
Server-side zod validation · honeypot + minimum fill time · per-IP limit (in-memory) + per-email limit (SQL) · same-origin check · body size cap · CSP, HSTS, frame-deny headers · RLS with no public access · service key server-only (`server-only` import guard).

### Accessibility
Semantic landmarks, one `h1`, ordered headings, skip link, visible focus, keyboard-trapped mobile menu with Escape, labelled form fields with `aria-invalid`/`aria-describedby`, focusable error summary, live thank-you region, native `<details>` FAQ, `prefers-reduced-motion` respected everywhere (hero renders a static network, reveals and marquee disabled), content visible without JavaScript.

## Go-live checklist

Run `npm run check:placeholders` — it lists everything below that is still open.

- [x] Official white Rainmakers logo and square mark in `public/brand/`; PNG favicon in `app/icon.png`
- [ ] Real Rainmakers communities in Supabase (name, description, WhatsApp link)
- [ ] Confirm the Italian Rainforest WhatsApp community is the one to promote
- [ ] Testimonials: confirm with each person, then mark VERIFIED
- [ ] Legal entity, contact email, social profiles (only if current)
- [ ] Privacy and cookie policy validated by legal/DPO; remove draft banner and `noindex`
- [ ] Update Rainforest figures and `asOf` in `content/shared.ts`
- [ ] Lighthouse on the Vercel preview (target Performance > 90); submit `sitemap.xml` to Search Console

## Local preview without Next.js

`scripts/preview/` renders the real components with esbuild + react-dom (used during development where the npm registry was unavailable). Not needed for normal work: use `npm run dev`.
