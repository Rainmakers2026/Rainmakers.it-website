# 00 — Specifica tecnica (PRD v2)

Fonte di verità: PRD "Rainmakers.it — Website Redesign & Lead Generation Platform" (v2).
Questa specifica segue l'ordine richiesto dal PRD §52: architettura → componenti → contenuti → data model → routing → Supabase → analytics → SEO → responsive → UI.

Principio di prodotto (§54): *Rainmakers is not just a company you discover. It is an ecosystem you can enter.*

---

## 0. Cosa cambia rispetto alla build v1

| Area | v1 (PRD precedente) | v2 (questo PRD) |
|---|---|---|
| CTA primaria | "Entra in Rainmakers" → form | **Esplora l'ecosistema → Italian Rainforest** (§37) |
| CTA secondaria | Esplora Rainforest | **Entra nella community → selezione community** |
| CTA terziaria | Parla con Rainmakers (intento del form) | **Connettiti con Rainmakers → form** |
| Community | 1 richiesta d'accesso generica via form | **Elenco community letto da Supabase** (`communities`), più community, link WhatsApp diretti, nessun hardcode (§16–17) |
| Form | 6 obbligatori + blocco opzionale + 3 intenti | **Nome, cognome, email, azienda, ruolo, profilo (obbligatori); sito/LinkedIn e "cosa cerchi" facoltativi; consenso** (§18–19) |
| Qualificazione | company_stage, challenges, interests | **profile_type** (founder, startup/scaleup, investor, corporate, innovation professional, other) + **interest** |
| Social proof | 7 testimonianze del vecchio sito + Tribe | **Mostrate solo se marcate VERIFIED** (autorizzate). Oggi: sezione nascosta, materiale conservato come TO VERIFY (§26) |
| Numeri | anno 2011, statistiche Rainforest | Solo dati con fonte e data. Statistiche Rainforest mantenute come VERIFIED (fonte pubblica, datate) |
| Footer | ragione sociale, indirizzo, P.IVA, email | **Rimossi finché non confermati** (§48). Contatto → form |
| Sezioni | 12 (con Proof, Audience, Join) | **11 + FAQ** nell'ordine §7, con nuova sezione **Network** animata e interattiva (§14) |
| Come funziona | 5 step | **4 step**: Discover, Connect, Participate, Grow (§15) |
| Pagine legali | Privacy (bozza) | Privacy **+ Cookie Policy** (bozze, noindex) |
| Contenuti | 1 file per lingua | **1 file per sezione per lingua** (`content/it/*`, `content/en/*`) (§33) |
| Governance | `TODO_CONFIRM` | **VERIFIED / TO VERIFY / PLACEHOLDER** con i formati placeholder del §53 |
| Logo | wordmark provvisorio | **Componente con varianti** (white/black/color/square) scelte per sfondo, fallback finché i file non arrivano (§31) |
| Analytics | eventi + scroll_25…90 | Catalogo §44, **`scroll_depth` con parametro `percent`** |
| Language switch | conserva l'hash se presente | **Conserva sempre la sezione corrente** (scroll-spy) (§32) |

---

## 1. Architettura

```
Browser ──► Vercel (Next.js 15, App Router, RSC)
              ├─ /it, /en            pagine statiche (SSG) + ISR 5 min per le community
              ├─ /it/privacy, /it/cookie (+ /en)
              ├─ /api/lead            Route Handler (Node) → Supabase RPC submit_lead()
              └─ opengraph-image      generata in build per lingua
Supabase (Postgres, EU)
  ├─ leads                 scrittura solo via RPC (service key, server-side)
  ├─ communities           lettura pubblica delle righe attive (RLS) — fonte delle card community
  ├─ content               futuro CMS leggero (vuota)
  ├─ ecosystem_links       futuri link/risorse (vuota)
  └─ newsletter_subscribers futuro (vuota)
GitHub ──► Vercel (preview per branch, production su main)
```

Principi: zero dati inventati nel database; tutto il copy versionato nel repo; JavaScript client limitato a "isole" (header, hero canvas, network map, form, effetti di scroll).

## 2. Gerarchia dei componenti

```
app/[locale]/layout.tsx         <html lang>, font, metadata, Analytics
└─ app/[locale]/page.tsx        carica dizionario + community (server)
   └─ HomePage
      ├─ Header (client)        nav, scroll-spy, language switch con sezione, menu mobile
      ├─ main
      │  ├─ 01 Hero             + HeroNetwork (client canvas)
      │  ├─ 02 Why              il problema: accesso
      │  ├─ 03 About            definizione + heritage sintetica
      │  ├─ 04 Access           6 categorie di accesso
      │  ├─ 05 Rainforest       + RainforestStats
      │  ├─ 06 Network          + NetworkMap (client, interattiva) + Layers (gateway → intelligence → community)
      │  ├─ 07 HowItWorks       4 step
      │  ├─ 08 Audience         founder primario + personas secondarie
      │  ├─ [Proof]             renderizzata solo se esistono testimonianze VERIFIED
      │  ├─ 09 Community        CommunityCard[] da Supabase (fallback da config)
      │  ├─ Connect             LeadForm (client) + success state con next action
      │  ├─ FAQ                 <details>, FAQPage schema solo per risposte senza placeholder
      │  └─ 10 FinalCta
      ├─ 11 Footer
      ├─ StickyCta (client, mobile)
      ├─ ClientEffects (client)  reveal, tracking delegato, scroll_depth, faq_open
      └─ JsonLd
```

## 3. Struttura dei contenuti

```
content/
  types.ts            tipi per sezione + Dictionary
  governance.ts       stati VERIFIED | TO_VERIFY | PLACEHOLDER, costanti placeholder, helper
  shared.ts           fatti non linguistici, ognuno con stato e fonte
  it/ en/
    index.ts          assembla il dizionario
    meta.ts ui.ts hero.ts why.ts about.ts access.ts rainforest.ts network.ts
    how.ts audience.ts proof.ts community.ts connect.ts faq.ts final.ts footer.ts legal.ts
```

Regole:
- Ogni testo non verificabile usa esattamente i formati del §53: `[PLACEHOLDER — CONTENT REQUIRED]`, `[STATISTIC TO VERIFY]`, `[LINK TO BE PROVIDED]`, `[WHATSAPP COMMUNITY LINK TO BE PROVIDED]`, `[TESTIMONIAL PLACEHOLDER]`.
- I placeholder sono resi visibilmente (badge tratteggiato) per non passare inosservati in staging; `npm run check:placeholders` li elenca tutti e fallisce in CI se `STRICT_CONTENT=1`.
- `npm run check:content` verifica che IT ed EN abbiano la stessa struttura e che le opzioni del form coincidano con i valori del database.

## 4. Data model

```sql
leads(id, first_name, last_name, email citext unique, company, role,
      website_or_linkedin, profile_type, interest, language, consent,
      consent_version, consent_at, utm jsonb, status, created_at, updated_at)

communities(id, slug unique, name_it, name_en, description_it, description_en,
            target, category, whatsapp_url, status, capacity, sort_order,
            created_at, updated_at)
  status ∈ active | full | coming_soon | archived

content(id, key, locale, value jsonb, status, updated_at)                 -- futuro
ecosystem_links(id, label_it, label_en, url, category, status, sort_order) -- futuro
newsletter_subscribers(id, email, language, consent, consent_at, status)  -- futuro
lead_events(id, lead_id, language, utm, created_at)                       -- attribuzione + rate limit
```

`profile_type ∈ founder | startup | investor | corporate | innovation_professional | other`.

## 5. Routing IT/EN

- `/it` e `/en`; `/` → reindirizzo 307 per `Accept-Language` (nessun header → `/it`, lingua non supportata → `/en`).
- Language switcher: link a `/{altra lingua}#{sezione corrente}` calcolata dallo scroll-spy; ogni sezione ha lo stesso `id` nelle due lingue.
- `hreflang` it, en, x-default (→ /it); canonical per lingua; sitemap con alternates.

## 6. Layer Supabase

| Operazione | Dove | Chiave |
|---|---|---|
| Inserimento lead | `app/api/lead/route.ts` → `lib/supabase/leads.ts` → RPC `submit_lead(p jsonb)` | service/secret key, solo server |
| Lettura community | `lib/supabase/communities.ts` (server, `revalidate: 300`) → REST `communities?status=in.(active,full,coming_soon)` | anon/publishable key + policy RLS di sola lettura |
| Fallback | se Supabase non è configurato o la tabella è vuota: `content/shared.ts → communitiesFallback` | — |

Supabase è vuoto: nessun seed automatico. `supabase/seed.example.sql` contiene un esempio commentato da compilare con dati reali.

## 7. Analytics

| Evento | Quando | Proprietà |
|---|---|---|
| `page_view` | mount | `locale`, `path` |
| `language_switch` | click switcher | `from`, `to`, `section` |
| `hero_cta_click` | CTA hero | `cta` (rainforest/community), `locale` |
| `rainforest_cta_click` | ogni link a Rainforest | `location` |
| `community_cta_click` | ogni "Entra nella community" | `location` |
| `contact_cta_click` | ogni "Connettiti con Rainmakers" | `location` |
| `lead_form_start` | primo focus nel form | `locale` |
| `lead_form_submit` | invio riuscito | `profile_type`, `locale` |
| `lead_form_error` | validazione fallita | `fields` |
| `whatsapp_click` | click link WhatsApp | `community`, `location` |
| `faq_open` | apertura FAQ | `index` |
| `scroll_depth` | 25/50/75/90% | `percent` |

Naming: `snake_case`, oggetto_azione. Destinazioni: Vercel Web Analytics (cookieless) + `window.dataLayer`. Nessun dato personale nelle proprietà.

## 8. SEO / GEO

- Title/description per lingua (§45), OG + Twitter per lingua, OG image generata.
- JSON-LD: `Organization` (solo campi verificati: nome, url, descrizione, foundingDate, logo quando disponibile), `Dataset` Italian Rainforest con relazione `owns`, `WebSite`, `WebPage`, `FAQPage` (solo risposte complete).
- Definizioni esplicite nel copy: Rainmakers, Italian Rainforest, innovation ecosystem, entrepreneurial community, ecosystem intelligence (sezioni About, Rainforest, Network, FAQ) + `public/llms.txt`.
- Keyword §22 integrate nei testi, non elencate.

## 9. Responsive

Mobile-first; breakpoint 560 / 760 / 960 / 1080 px. Su mobile: hero con rete sopra il titolo, CTA a tutta larghezza, network map in vista "lista" verticale navigabile, CTA fissa in basso (Esplora l'ecosistema) nascosta in hero e sul form. Nessuno scroll orizzontale (verificato con test automatico a 390 px).

## 10. UI e animazioni

Animazioni con funzione narrativa (§29): hero (punti isolati → rete), reveal progressivi, network map che si accende per connessioni, barre Rainforest. Tutto disattivato con `prefers-reduced-motion`. Palette e tipografia §30 come token in `app/globals.css`.
