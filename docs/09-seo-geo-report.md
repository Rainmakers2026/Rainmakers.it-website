# 09 — SEO / GEO, accessibility and performance report (Phase 7)

Date: 12 October 2026. Measured on local **production builds** (`next build` + `next start`) of the
code before and after Phase 7, with Lighthouse 12.6.1 (mobile profile, simulated throttling,
Microsoft Edge headless). Local measurements are indicative: no CDN, no HTTP/2 edge caching. Single
runs on this machine vary by up to ±10 performance points, so medians of 3 runs are compared.
No score is claimed beyond these measurements.

## Problems found and changes applied

| Problem (source) | Change |
|---|---|
| `/it/join`, `/en/join`, `/it/news`, `/en/news` declared the homepage as canonical (audit; confirmed in the production build) | Each page now sets its own canonical, it/en/x-default alternates and Open Graph URL/title (`buildMetadata(dict, path, …)`) |
| Titles/descriptions/OG used the old tagline ("Costruisci meglio…") | New IT/EN titles (≤ 60 chars) and descriptions (≤ 160) aligned with the approved positioning |
| News page indexable with placeholder articles ("[Titolo in arrivo]") | `noindex, follow` and removed from the sitemap until real articles exist |
| Sitemap `lastModified` changed on every build; no `x-default` | Fixed content dates; `x-default` alternate added |
| `robots.txt` had the non-standard `Host:` line | Removed |
| JSON-LD: founder only as a name | `Person` node (name, role, LinkedIn + YouTube channel), linked from `Organization`; `email` / `contactPoint` info@rainmakers.it (PRD §12). Substack not listed until confirmed |
| `llms.txt` described the old page structure | Rewritten: definition, audience, business units, Rainmakers vs Italian Rainforest, contacts — verified facts only |
| A11y: language switch "EN" announced as "Read this page in English" (WCAG 2.5.3) | Accessible name now starts with the visible text |
| A11y: active filter-chip counter contrast 4.21:1 | Darker counter background (≥ 4.5:1) |
| 90 dead CSS rules (59 classes) from sections removed in Phase 1 | Removed by a PostCSS script that keeps any class used in the source (including dynamic prefixes): `globals.css` 82.8 KB → 73.3 KB |
| Hero canvas redrew every frame indefinitely (PRD §8.4) | Settles into a static network after ~12 s (ambient phase capped at ~30 fps) |

Not added: `VideoObject` (Google requires the upload date, which is not publicly verifiable — add it
from YouTube Studio), ratings/reviews, any new tracker or third-party script.

## Measurements (median of 3, mobile, `/it`)

| | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Before | 75 (71–81) | 97 | 96 | 100 | 3.2 s | 703 ms | 0 |
| After | 78 (76–79) | **100** | 96 | 100 | 3.2 s | 597 ms | 0 |

Other pages after: `/en` accessibility 100, SEO 100; `/it/join` performance 97, accessibility 100,
SEO 100. Lighthouse's SEO score was already 100 before: it does not detect a canonical pointing to
another page of the same site, which is why the canonical bug needed a manual check.

Note: a first attempt that delayed the hero animation until the browser was idle made TBT worse
(median 798 ms) — it was reverted; only the "settle" behaviour was kept.

## Remaining priorities (not changed in this phase)

1. **Homepage JavaScript/hydration** — the main TBT source: React hydration of the whole page,
   including the Tribe/Advisory explorers whose full data travels in the page payload (HTML ≈ 227 KB).
   Option: hydrate below-the-fold interactive sections only when they become visible.
2. **Layout cost** — ~1,050 DOM elements and two full relayouts during load (consistent with the web-font
   swap); LCP is the hero paragraph, delayed by render work rather than network.
3. Lighthouse also reports ~11 KB legacy JavaScript (polyfills) and ~21 KB unused JavaScript.
4. `best-practices` 96: the only failure is the Vercel Analytics script 404, which exists only outside
   Vercel hosting (local test artefact).
5. Measure again on the Vercel Preview (real CDN) before any production decision.
6. Content decisions still open: founding date / InnovUp / Nuvolab in JSON-LD (approved as existing,
   flagged D22), Substack URL confirmation, privacy policy placeholders.
