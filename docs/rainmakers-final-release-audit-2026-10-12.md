# Rainmakers.it — Final regression audit and release readiness (Phase 8)

Date: 12 October 2026 · Scope: verification only (no features, no fixes) · Branch `main` @ `4ff189b`,
**all work uncommitted** (96 tracked files changed, 57 untracked entries, nothing staged).

> **Update 13 October 2026**: visual and motion round, "Dicono di noi" section, original-site score,
> commit on branch `feat/website-optimization` and Vercel **Preview** (approved). See section 9.

Legend — **Verified**: observed in a test, build, HTTP check or screenshot during this audit.
**Code only**: implemented and unit-tested, but not exercised against live Supabase/Brevo.
**Not verified**: could not be checked here (credentials, live services, real devices).

## 1. Recommendation

**Ready for a Vercel Preview (visual, content and UX review). Not ready for production.**

The site builds, renders correctly in Italian and English, and fails safely: without configuration
every form returns an honest error. Production is blocked by missing configuration, unverified live
integrations, legal text and the domain plan (section 6).

## 2. PRD acceptance checklist (PRD §23)

| PRD requirement | Status | Evidence |
|---|---|---|
| **Copy & positioning** | | |
| Homepage clearly defines Rainmakers | Completed — Verified | Hero + "Perché Rainmakers" definition rendered (IT/EN) |
| Main audience recognisable | Completed — Verified | Hero eyebrow, "Per chi è" line |
| Visible text reduced ~60%, documented | **Partially** — Verified | IT 2,036 → 1,126 (−44.7%), EN 2,006 → 1,151 (−42.6%) after adding the 7 reviews (+255/265 words); without them −57%. `npm run count:words` |
| CTAs coherent, conversion-oriented | Completed — Verified | Hero "Entra in Rainmakers" → final 3-path section; sticky mobile CTA on-site |
| No invented promises or proof | Completed — Verified | The 7 testimonials from rainmakers.it (2021) are published at the Rainmakers team’s request (13 Oct); no "guarantee" wording used; founder facts limited to verified ones |
| **Founder & credibility** | | |
| Circular placeholder for Francesco | Completed — Verified | Screenshot; photo slot `founderProfile.photo` |
| Founder section with verified materials | **Partially** | Only 2 verified facts; photo, bio and further credentials not supplied |
| Video embedded and responsive | Completed — Verified (thumbnail, CSP); playback Not verified | youtube-nocookie, click-to-load, 16:9 |
| Rainforest material kept out of founder section | Completed — Verified | |
| **Design** | | |
| Brand colours preserved | Completed — Verified | Tokens unchanged |
| Explanatory infographics | Completed — Verified | Network map (entrepreneur + 6 elements), 5-step path |
| Animations don't hinder reading | Completed — Verified | Compositor-only CSS animations, paused off-screen, removed with `prefers-reduced-motion` (section 9) |
| Tribe / Advisory favicons more legible | Completed — Verified | 88×56 plates, dark plates, zoom; 8 logos missing (initials) |
| Italian Rainforest section distinct | Completed — Verified | Exact title, own background (asset to confirm) |
| **Forms & integrations** | | |
| Join saves data and file references | **Blocked** — Code only | Migrations 0003/0004, 22 API tests; no live Supabase |
| Files accessible only to authorised users | **Blocked** — Code only | Private bucket, no storage policies (static review) |
| Newsletter saves to Supabase | **Blocked** — Code only | Migration 0005, 24 Brevo workflow tests |
| Eligible contacts synced to Brevo "Contatti" | **Blocked** — Code only | Only after double opt-in |
| Contact forms never subscribe to marketing | Completed — Verified (tests) | No Brevo/newsletter call from contact, Join or WhatsApp forms |
| Welcome email via Brevo without marketing list | **Blocked** — Code only | Brevo HTTP API (approved D14); at most once per record |
| Errors handled correctly | Completed — Verified | Unit tests + production build without config (honest errors) |
| **Contacts & links** | | |
| Operational address info@rainmakers.it | Completed — Verified | No active italianrainforest@ reference |
| Substack shown as "Italian Rainmaker" | Completed — Verified | URL changed (old one 404) — **to confirm** |
| Italian Rainforest links correct | Completed — Verified | `/it` and `/en` map URLs, HTTP 200 |
| **SEO, accessibility, responsive** | | |
| IT/EN metadata coherent | Completed — Verified | Production build HTML |
| Canonical / hreflang correct | Completed — Verified | Self-canonicals per page; they point to www.rainmakers.it, which still serves WordPress (see blockers) |
| Structured data valid and verifiable | **Partially** | JSON-LD parses and matches the page; Google Rich Results test not run; no VideoObject (upload date unknown) |
| Works on desktop, tablet, mobile | Completed — Verified (screenshots 1440/1024/768/390) | Real devices Not verified |
| Essential accessibility checks | Completed — Verified (Lighthouse 100) | Manual keyboard / screen-reader pass Not done |
| **Annotations** | | |
| Notes saved in a persistent database | **Blocked** — Code only | Migration 0006 |
| Notes persist after refresh | **Blocked** — Not verified | |
| Access limited to the team | **Blocked** — Code only | 20 route tests; DB policy test needs live DB |
| Tested on the intended domain, or dependencies documented | Partially | Dependencies documented (`docs/08-annotations-setup.md`) |
| **Deployment** | | |
| Code passes available checks | **Partially** | Typecheck, 90 tests, build pass; full `npm run lint` has 2 pre-existing errors |
| Vercel Preview verified | See section 9 | Approved 13 Oct 2026 |
| Production only after approval | Respected | Nothing deployed |
| Final report | Completed | This document |

Other PRD items: §18 analytics — events implemented except the PRD names `scroll_25/50/75/90`
(still a single `scroll_depth` event with `percent`) → **Partially**. §11.2 notification to
info@rainmakers.it (optional in the PRD) → deferred by decision. §21.4 Lighthouse Performance > 90
→ **Not met** (median 84 local after the visual round; original site ≈61). §17.6 SEO/GEO report → `docs/09-seo-geo-report.md`.

### Deviations from the approved plan

1. Newsletter **automatic popup trigger** (plan D12: 50% scroll / exit intent) not implemented — the
   newsletter opens from buttons only.
2. Scroll events not renamed to the PRD names (plan D21).
3. Annotations: built on Supabase Auth per the Phase 6 brief, instead of the interim Vercel Toolbar
   recommended in plan D20.
4. Team notification emails deferred (decision in Phase 5).
5. Airtable mirror kept (plan D18 suggested removal; no decision taken).
6. Plan "Phase 0" not executed: no feature branch, no baseline commit, no `.gitattributes`, lint not fixed.
7. Phases were run in the order of the briefs, not the plan's numbering.

## 3. Tests performed (actual results)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ pass |
| `npm test` (24 validation, 22 API, 24 Brevo workflow, 20 annotation access tests; IT/EN content check) | ✅ 90/90 pass |
| `npm run lint` (full) | ❌ 2 errors, 1 warning — `next-env.d.ts` (triple-slash), `scripts/preview/render.tsx` (`any`), `eslint.config.mjs` warning; pre-existing, outside the build |
| `next build` (production, scratch copy) | ✅ compiled; build-time Supabase fetch falls back to static communities when unreachable |
| Canary build: fake secrets in env, search in `.next/static` and `.next/server` | ✅ no secret value or secret variable name in client or server output |
| Secrets in tracked files and full Git history | ✅ none found; `.env.local` git-ignored |
| Routes (production build): `/` → 307 `/it`; `/it`, `/en`, `/it/join`, `/en/join`, news, privacy, cookie, newsletter/confirm → 200; unknown → 404; robots, sitemap, llms.txt, icon, rainforest WebP → 200 | ✅ |
| Security headers: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | ✅ present |
| Forms on production build **without** configuration | ✅ `/api/lead` 500 not_configured, `/api/newsletter` 500, `/api/community` 500, `/api/annotations` 503, cron 401 — no false success |
| Link check (63 links: 4 pages + company websites) | ⚠️ 47 OK; www.rainmakers.it canonical targets 404 (WordPress domain); LinkedIn 999 and 3 × 403 (bot protection, check manually); **8 company websites fail** (DNS/TLS/timeout): adottup.it, roboforit.com, unconventionalroad.it, 360by360competiton.com, futurefashionsolution.com (TLS), sanoesazio.com, innovatecventure.it, designwanted.com / art-er.it (timeouts) |
| Screenshots of the production build: desktop 1440 (IT), tablet 1024 (EN), tablet 768 (Track record), mobile 390 (final section, Join EN) | ✅ layouts correct |
| Lighthouse mobile, local production build (Phase 7, code unchanged since), median of 3 on `/it` | Performance 78, Accessibility 100, Best practices 96, SEO 100; `/it/join` 97/100/96/100 |
| Static SQL review (11 tables, 16 functions, storage) | ✅ RLS on all tables; definer functions with fixed search_path, revoked from anon, executable only by service_role (membership helpers: authenticated); one private bucket, no storage policies |
| Live Supabase (migrations, RLS policy test, uploads), live Brevo (emails, list), annotation sign-in, real devices, Google Rich Results | ❌ Not performed — no credentials / live services |

## 4. Security and privacy findings

| Severity | Finding |
|---|---|
| Info (positive) | No secrets in Git history or bundles; service and Brevo keys used server-side only; annotation routes use the user's JWT, never the service key; logs exclude names/emails (tested) |
| Info (positive) | Contact, Join and WhatsApp submissions never reach the marketing list; newsletter uses double opt-in with consent version and timestamps |
| Medium | Rate limiting is in-memory per serverless instance: weak against distributed abuse of forms/uploads and could exhaust the Brevo daily quota. Add Vercel Firewall rules or a shared store before launch |
| Medium | Privacy policy still has placeholders (controller, contact, retention, hosting region) and must describe uploads, Brevo, YouTube and annotations — **legal blocker** |
| Medium | Retention period and access rules for uploaded CVs/pitch decks not defined |
| Low | CSP allows `'unsafe-inline'` scripts (needed by Next inline scripts and JSON-LD); nonce-based CSP is a later hardening option |
| Low | "Already subscribed" newsletter message reveals subscription status for an address (accepted requirement; rate-limited) |
| Low | Development mock mode shows success messages without storing (development only; production returns errors — verified) |
| Low | HSTS `includeSubDomains; preload` will apply to rainmakers.it subdomains once served from this app — confirm before the domain switch |
| Low (process) | During this audit a secrets scan printed the local, git-ignored, short-lived `VERCEL_OIDC_TOKEN` into the local session output. Not committed; rotate with `vercel env pull` if desired |
| Not verified | Live behaviour of RLS, storage privacy, Supabase Auth settings (sign-ups off) — run `supabase/tests/0006_annotations_rls.sql` and the checks in `docs/06–08` |

## 5. Required environment variables (names only)

| Variable | Used by | Status |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, confirmation links | not set in Vercel |
| `SUPABASE_URL` | all forms, annotations | not set |
| `SUPABASE_SERVICE_ROLE_KEY` | server writes, uploads | not set |
| `SUPABASE_ANON_KEY` | communities, annotation sign-in (user JWT) | not set |
| `BREVO_API_KEY`, `BREVO_CONTACTS_LIST_ID`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_REPLY_TO` | newsletter, welcome / Join emails | not set |
| `CRON_SECRET` | daily Brevo retry job | not set |
| `JOIN_UPLOAD_MAX_MB` | optional (≤ 4) | optional |
| `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_PITCH_TABLE_ID`, `AIRTABLE_CV_TABLE_ID` | optional Join mirror | optional |
| `LEADS_MOCK` | must **not** be set in production | — |

## 6. Remaining blockers

**For a Preview**: none technical. Without env vars the forms show honest errors (useful for visual
review). With Preview env vars + migrations applied, the integrations can be tested end to end.

**For production**:
1. Supabase project: env vars, migrations 0003–0006, pre-flight and RLS test, Auth settings (email OTP,
   sign-ups disabled, SMTP), team members.
2. Brevo: API key, "Contatti" list id, verified sender, SPF/DKIM/DMARC on rainmakers.it (DNS access).
3. Privacy & cookie policy content; retention rules for uploads.
4. Domain plan: www.rainmakers.it still serves WordPress — canonicals/sitemap point there; confirmation
   links depend on `NEXT_PUBLIC_SITE_URL`. Decide the cutover (and HSTS implications).
5. Live end-to-end tests (forms, uploads, double opt-in, welcome email, annotations) on the Preview.
6. Commit the work to a feature branch (currently all uncommitted on `main`, inside OneDrive).
7. Content decisions: founder photo and credentials, testimonials verification, Substack URL,
   rainforest background licence, TEDx mention, 3 vs 4 Track record rows, video upload date
   (VideoObject), founding date/InnovUp/Nuvolab in JSON-LD (D22), broken company websites, 8 missing
   logos, Assolombarda spelling.
8. Optional before launch: Lighthouse Performance (78 vs PRD target 90 — hydration of large homepage),
   rate limiting hardening, full lint clean-up, newsletter auto-popup, PRD scroll event names.

## 7. Proposed Preview action (requires your approval — not triggered)

Recommended sequence:
1. Create a branch (e.g. `feat/website-optimization`) and commit the current working tree there — no
   change to `main`, nothing discarded.
2. Either push the branch (if the GitHub ↔ Vercel integration is active, Vercel builds a Preview), or
   run `vercel deploy` (without `--prod`) from the project folder. Both create a **Preview only**,
   protected by Vercel Authentication; the production domain is not touched.
3. Optionally first add Preview-scoped env vars (section 5) and apply the migrations to a staging
   Supabase project, to test integrations; otherwise the Preview is for visual/content review only.

Each step needs explicit approval (commit, push/deploy, env vars, migrations).

## 8. Manual verification steps (local)

```bash
npm install            # already installed
npm run typecheck && npm test && npm run count:words
npm run build && npx next start -p 3100   # stop the dev server first, or build in a copy (shares .next)
```

Then check on http://localhost:3100: `/it`, `/en`, `/it/join`, `/en/join` at 390 / 768 / 1440 px;
header navigation and language switch; hero CTA → final section; video plays after click; Italian
Rainforest CTA opens the map in the right language; footer email and Substack links; forms show clear
validation errors and (without configuration) an error instead of success; `?review=1` shows the
review panel ("not configured" without Supabase). With credentials, follow `docs/06-supabase-setup.md`,
`docs/07-brevo-setup.md` and `docs/08-annotations-setup.md` (verification sections).

## 9. Update — 13 October 2026: visuals, motion, reviews, Preview

### What changed
- **Illustrations** (`scripts/generate-art.cjs`, reproducible; the umbrella is the official mark path):
  - Hero (inline SVG): over the Milan skyline (Duomo, Velasca, Pirellone, Bosco Verticale, UniCredit), a
    cloud woven from the network pours light into five inside-out umbrellas; shoots, a young tree, and
    clients walking up a lit path (the "rainmaker brings clients" meaning).
  - "Why Rainmakers": alone under an open umbrella vs. together collecting the rain; the gust flips an
    umbrella mid-air (birth of the mark); puddles of collected rain.
  - Glows are radial gradients, not SVG blur filters (filters delayed first paint by ~350 ms).
- **Copy**: hero "Le opportunità non cadono dal cielo. Insieme, le facciamo piovere." /
  "Opportunities don’t fall from the sky. Together, we make it rain."; benefits title
  "C’è chi si ripara dalla pioggia. E chi la raccoglie." / "Some shelter from the rain. Others collect it."
- **Motion** (CSS only, transform/opacity, compositor):
  - rain falling into the umbrellas with splashes; living Italian Rainforest (drift, rain, mist,
    glowing organisations);
  - scroll-driven (`animation-timeline`, with fallback to the existing reveals): hero depth on exit,
    titles sliding from alternating sides, cards tilting up into place, reviews entering from both
    sides, a rain curtain falling faster than the scroll (motion-parallax illusion), dolly zoom
    ("Vertigo") on the Rainforest background, water line filling the steps, progress bar;
  - everything pauses off-screen (`data-fx`) and is removed with `prefers-reduced-motion`. The JS
    hero canvas and the per-frame `--scroll` style write were removed.
- **"Dicono di noi"** (`components/sections/Reviews.tsx`, server-rendered, no client JS): all 7
  testimonials with company logos, before the final section. Under them the hook
  "Hai fatto parte della Tribe? La tua storia può ispirare il prossimo founder." with the button
  **"Lascia una review"**: a pre-filled email to info@rainmakers.it that asks for consent to publish.
  New analytics event `review_cta_click`.
  - Published at the team’s request. If an author withdraws consent, set that testimonial back to
    `TO_VERIFY` in `content/{it,en}/proof.ts` and it disappears.
  - `components/sections/Testimonials.tsx` (older client carousel) is no longer used; kept, not deleted.
- **Footer social icons**: Facebook (`facebook.com/rainmakerssrl`, linked from the official rainmakers.it) as
  an icon under the brand, also in the Organization `sameAs`. Instagram icon ready but hidden: no profile
  URL is linked from rainmakers.it — add it in `content/shared.ts` → `socialProfiles` once confirmed.

### Lighthouse (mobile, local production builds, `/it`)
| Version | Performance | Accessibility | Best practices | SEO | Notes |
|---|---|---|---|---|---|
| Original site (before Phase 1) | ≈61 | 90 | 96 | 100 | 6 of 7 runs could not be scored (NO_LCP: hero invisible on load); TBT 1.9 s |
| Phase 8 (before this round) | 77 | 100 | 96 | 100 | median of 3; TBT ≈650 ms |
| Now | **84** | 100 | 96 | 100 | median of 3 (a 4-run interleaved A/B gave 84.5 vs 81.5); TBT ≈230 ms, CLS 0 |

Measurements on this machine vary by up to ±8 points between rounds; the comparisons were
interleaved. Remaining gap to the PRD target (90): FCP/LCP ≈2.0/3.6 s (simulated slow 4G). The HTML
grew from 42 to 62 kB (inline hero, also repeated in the React payload, and the reviews); shrinking the
hero markup or moving the reviews below a "show more" are the next levers.

### Checks
`tsc` ✅ · eslint on all changed code ✅ (full `npm run lint`: same 2 pre-existing errors) ·
`npm test` 90/90 ✅ · production build ✅ · screenshots 1440 / 1024 / 768 / 390 ✅.

### Release actions (approved 13 October 2026)
- Branch `feat/website-optimization` created from `main`; work committed there (`main` untouched).
- GitHub push **refused** (403: account `charliox` has no write access to
  `Rainmakers2026/Rainmakers.it-website`). Preview created instead with `vercel deploy` (no `--prod`)
  from a clean `git archive` of the commit (no local env files uploaded):
  **https://rainmakers-5cqdj3ig8-rainmakers3.vercel.app** — target `preview`, Ready; `/it`, `/en`,
  `/it/join`, `/en/join`, robots, sitemap → 200 (13 Oct 2026, commit `4585b0a`). Protected by Vercel
  Deployment Protection; no Preview env vars, so forms show honest "not configured" errors.
- **No production deployment.** Production blockers in section 6 still apply (Supabase, Brevo, legal
  texts, domain plan, live end-to-end tests).
