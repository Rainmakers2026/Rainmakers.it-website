# 02 — Revisione del PRD v1.0

Il PRD è solido su strategia, gerarchia e principi. Questa revisione elenca solo ciò che serviva decidere per costruire lo Step 2. Per ogni punto: il problema, la decisione presa nel codice, e come cambiarla.

## A. Decisioni prese (modificabili)

| # | Tema | Problema nel PRD | Decisione implementata | Dove cambiarla |
|---|---|---|---|---|
| 1 | **Lunghezza del form** | 13 campi (§33) contraddicono §37 "il form non deve essere un ostacolo" | Form progressivo: 6 campi obbligatori (nome, cognome, email, azienda, ruolo, stage) + consenso; il resto (sito, LinkedIn, sfide, interessi, fonte, messaggio) in un blocco opzionale "Raccontaci di più" | `components/LeadForm.tsx` |
| 2 | **Una CTA, tre intenti** | Join / Join community / Talk sono 3 conversioni ma il PRD descrive un solo form | Un solo form con selettore d'intento: `join` → solo lead; `community` → lead + `community_requests`; `contact` → lead + `contact_requests`. Ogni CTA preseleziona l'intento | `lib/intent.ts` |
| 3 | **Onboarding community** | §21: "Join" o "Request Access" dipende dal processo reale, che non è definito | **Richiesta di accesso** (curata, approvazione manuale) — è l'opzione onesta se il processo non è automatico. Nessuna "limited membership" mostrata (§12: niente falsa scarsità) finché non confermata | `content/shared.ts` → `community.limitedMembership` |
| 4 | **Link WhatsApp** | Le community private non hanno link pubblici noti | Thank-you page offre la community *pubblica* di Italian Rainforest (link reale) + Explore Rainforest. Il link alle community private non viene mai esposto nel client | `content/shared.ts` |
| 5 | **Testimonianze** | §23 chiede di riscriverle in Problem → Rainmakers → Outcome | Le citazioni restano fedeli all'originale; la struttura P→R→O è resa con etichette di contesto. Riscrivere le parole di persone reali le renderebbe testimonianze non autentiche | `content/*.ts` → `proof` |
| 6 | **Analytics** | Provider non specificato; GDPR | Vercel Web Analytics (cookieless, nessun banner necessario) + push su `window.dataLayer` per un eventuale GTM. GA4 non attivato: richiederebbe una CMP | `lib/analytics.ts` |
| 7 | **Lingua di default** | `/it` e `/en`, IT primaria | `/` reindirizza a `/it`, oppure a `/en` se il browser non è italiano. `x-default` → `/it` | `middleware.ts` |
| 8 | **Upsert dei lead** | Lo schema `leads` non dice cosa succede se la stessa email si iscrive due volte | Upsert su `email` (unique, case-insensitive): aggiorna il profilo, conserva lo storico tramite `community_requests`/`contact_requests` | `supabase/migrations/0001_init.sql` |
| 9 | **Rate limiting** | "dove appropriato" | 3 livelli: honeypot + tempo minimo di compilazione; limite per IP in memoria nella route; limite per email nella funzione SQL (max 5/ora) | `app/api/lead/route.ts`, SQL |
| 10 | **Immagini** | §41 chiede immagini generate, niente stock | Visual generativi in SVG/Canvas (rete di nodi che si connettono, modello dell'ecosistema, statistiche reali Rainforest): leggeri, nitidi, raccontano la trasformazione ALONE → CONNECTED (§43). Nessuna foto finta di persone | `components/visuals/` |
| 11 | **Logo** | 6 varianti "disponibili" ma non fornite | Wordmark tipografico provvisorio, chiaramente marcato, sostituibile con un file | `components/Logo.tsx` |
| 12 | **Privacy policy** | Richiesta dal §55 ma non fornita | Bozza strutturata in `/[locale]/privacy`, con banner "bozza da validare" | `content/legal.ts` |

## B. Punti aperti che richiedono una vostra decisione

1. **Processo di approvazione community**: chi approva, in quanto tempo, con quali criteri? (Il thank-you oggi promette "ti ricontattiamo", senza tempi.)
2. **Quante e quali community private** esistono (per tema? per stage? per città?). Il form oggi ha un'unica richiesta generica.
3. **Numeri di Rainmakers** da mostrare (rete, community, eventi, aziende supportate). Senza numeri verificati la sezione Proof si basa su anni di attività, testimonianze e dati Rainforest.
4. **Conferma testimonianze** (consenso al riuso, eventuali aggiornamenti dell'outcome).
5. **Data retention** dei lead (proposta: 24 mesi dall'ultima interazione) da inserire nella privacy policy.
6. **Notifiche**: chi deve ricevere una notifica a ogni nuovo lead? (Pronto un punto d'aggancio: webhook Supabase o Resend.)

## C. Incoerenze minori risolte

- §44 elenca la voce di navigazione "About" ma l'architettura §14 non ha una sezione About: mappata su Proof/Track record + storia (§24) + meaningful innovation (§25).
- §32 FAQ non ha una posizione nell'architettura §14: inserita tra "How to join" e "Final CTA".
- §66 heading 33.75px: applicato ai titoli di sezione (h2). Il titolo hero (h1) è più grande, altrimenti la gerarchia visiva dell'hero si appiattisce.
- §36 `main_challenge` e `interests` sono multi-selezione: salvati come `text[]` in Postgres.
- §36 manca un campo per l'intento e per i parametri UTM: aggiunti `intent` e `utm` (jsonb) per misurare la qualità per canale (KPI §40).
