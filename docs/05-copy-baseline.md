# 05 — Homepage copy reduction (PRD §5.1)

Measured with `npm run count:words` (scripts/count-words.ts): the real `HomePage` is rendered and the words
visible on load inside `<main>` are counted. Excluded as required by PRD §5.1: navigation, footer, form fields
and consent text, collapsed FAQ answers, screen-reader-only text, hidden and `aria-hidden` elements.
Same method and same data (communities fallback) before and after.

| | Before (12 Oct 2026) | After Phase 1 | Reduction |
|---|---|---|---|
| Italian `/it` | 2,036 | 860 | **−57.8%** |
| English `/en` | 2,006 | 875 | **−56.4%** |

PRD target: about −60% (≈ 814 words in Italian).

## Per section (Italian)

| Before | Words | After | Words |
|---|---|---|---|
| Hero | 28 | Hero (+ 2 CTAs) | 33 |
| Why | 74 | Why Rainmakers (benefits, merges Why + Access + Audience + About definition) | 109 |
| About | 243 | Founder (new) | 75 |
| Access | 123 | — merged | — |
| Rainforest | 141 | Italian Rainforest | 109 |
| Network | 94 | How it works (network + 5-step path + services; merges Network + How + Model) | 133 |
| How it works | 54 | — merged | — |
| Audience | 89 | — merged | — |
| Model | 478 | — condensed into How it works | — |
| Community | 98 | Community | 49 |
| Connect | 26 | Final: three ways in + contact form | 74 |
| Track record + testimonials | 509 | Track record (4 rows per list on load; testimonials hidden until VERIFIED) | 242 |
| FAQ (questions) | 48 | FAQ (6 questions) | 36 |
| Final CTA | 31 | — merged into Final | — |

## Remaining gap to −60%

Most of the remaining words are the Track record explorer rows (company data: name, status, city, year,
sector, FTE/revenue) and the data-source notes, kept for verifiability. Showing 3 instead of 4 rows per list
would reach about −60%; this is a business choice (more visible proof vs. fewer words).
