> **Nota (PRD v2):** con il PRD v2 i contenuti TO VERIFY non vengono pubblicati (testimonianze nascoste, dati societari rimossi dal footer). Stato aggiornato: `npm run check:placeholders`.

# 01 — Content audit (Step 1.5)

Fonti analizzate il 6 ottobre 2026:

- rainmakers.it (IT) e rainmakers.it/en — ultimo aggiornamento dichiarato: maggio 2021
- nuvolab.com — ultimo aggiornamento dichiarato: maggio 2021
- italian-innovation-map.vercel.app/en (Italian Rainforest) — dati live
- Intervista a Francesco Inguscio, ScaleUp Italy, febbraio 2021 (fonte terza)

Legenda (PRD §27/§58): **KEEP** · **REWRITE** · **REPURPOSE** · **REMOVE** · **VERIFY**.
Regola: preservare il valore, non il wording.

---

## 1. Fatti verificati usabili nel sito

| Fatto | Fonte | Uso nel sito | Stato |
|---|---|---|---|
| Rainmakers è un collettivo di imprenditori, attivo dal 2011 | rainmakers.it ("Since 2011") | Hero/About, schema `foundingDate` | KEEP |
| Sede a Milano | rainmakers.it ("Based in Milan") | About, schema `address` | KEEP |
| Ragione sociale Rainmakers s.r.l. a Socio Unico, via Carducci 8, 20123 Milano, P.IVA 07342210965 | footer nuvolab.com (2021) | Footer legale, privacy | **VERIFY** (indirizzo 2021) |
| Italian Rainforest: progetto creato da Rainmakers (nato come iniziativa CSR) | italian-innovation-map | Sezione Rainforest, FAQ | KEEP |
| Rainforest: 412 organizzazioni attive mappate (VC 168, incubatori/acceleratori 139, CVC 38, coworking 37, startup studio 29, angel network 21, istituzioni 13, media/community 13…) | italian-innovation-map, dati al 06/10/2026 | Statistiche Rainforest (con data) | KEEP — **aggiornare a ogni release** (`content/shared.ts`) |
| Rainforest: mappa + database interattivi, open data copyleft per uso non commerciale, aggiornamento partecipativo | italian-innovation-map | Rainforest + FAQ | KEEP |
| Community WhatsApp di Italian Rainforest (link pubblico) | italian-innovation-map | Thank-you page, sezione Community | KEEP — **VERIFY** che sia il link da promuovere |
| Email italianrainforest@rainmakers.it | italian-innovation-map | Footer/FAQ | KEEP |
| Pagina Facebook `rainmakerssrl` | metadata rainmakers.it | `sameAs` | **VERIFY** attività |
| 7 testimonianze nominative (Noonic, Startup Geeks, DIS, DesignWanted, Instilla, C+L, CrowdChicken) | rainmakers.it | Sezione Proof | KEEP con **VERIFY** (consenso al riuso, attualità) |
| Tribe: 21 aziende citate | rainmakers.it | Strip "Tribe" | **VERIFY** (alcune potrebbero essere cessate/uscite) |

## 2. Fatti trovati ma NON usati in pagina (richiedono conferma)

| Fatto | Fonte | Perché non è usato |
|---|---|---|
| "40+ programmi di corporate innovation, 25 startup in portfolio, 4 exit + 3 write-off" | Intervista ScaleUp Italy 2021 | Dato di 5 anni fa, fonte terza. Se confermato e aggiornato → sezione Proof |
| Fondatore: Francesco Inguscio | Intervista ScaleUp Italy | Il PRD è founder-centric sull'utente, non sul team. Utile per `founder` nello schema Organization e per una futura sezione Team — **VERIFY** |
| iBicocca ~4.000 studenti, MCE4x4 110–125 startup/edizione, Officine Formative Intesa Sanpaolo, StartLab UniCredit, Le Village by CA | nuvolab.com | Track record Nuvolab, audience corporate/istituzioni. Riformulabile come "esperienza di ecosystem building" solo con conferma che si possa citare |
| "Featured in TechCrunch, Wired, StartupItalia, Il Sole 24 Ore" | italian-innovation-map | Nessun link agli articoli trovato → non usato finché non abbiamo gli URL |

## 3. Classificazione contenuti — rainmakers.it

| Contenuto | Decisione | Note |
|---|---|---|
| Tagline "Meaningful Innovation — il bene fatto bene che paga bene" | **REWRITE** | Concetto valido (PRD §25). Diventa una riga nella sezione About: "Innovazione che crea valore reale per persone, imprese e società". La formula originale resta come citazione storica breve |
| Citazione Adriano Olivetti | **REMOVE** dal flusso principale | Bella ma lunga e autoreferenziale per un lead magnet. Candidata a una futura pagina "Manifesto" |
| Missione "Cambiare la nostra nazione in una sola generazione" | **KEEP** (breve) | È anche il "why" di Rainforest: crea continuità tra i due progetti. Usata in About |
| "Il futuro si può subire, gestire o creare… Noi siamo creatori di futuro" | **REWRITE** | Il concetto "future makers" resta, in chiave founder: "Costruito da imprenditori, per imprenditori" |
| Tre P: Paese / Persone / Pianeta | **REWRITE** | Ridotte a una riga nella sezione Meaningful innovation |
| Lean Integrated Approach (Idea → Scale) | **REPURPOSE** | Linguaggio da startup studio interno. Gli stadi alimentano le opzioni "Company stage" del form |
| Startup studio / VDO | **REMOVE** dal primo livello | Il PRD chiede di non posizionarsi come startup studio. Citato solo nelle FAQ ("Rainmakers è un acceleratore?") |
| Lab — "scaling as a service" (Marketing/Sales/Funding/CFO/CTO/HR-aaS) | **REPURPOSE** | Diventa il pilastro "Esperienza": competenze accessibili tramite la rete, non un catalogo servizi. Le aree diventano le opzioni "Main challenge" |
| Club (club deal) | **REMOVE** dal percorso principale | Contenuto per investitori (PRD §60). Futuro: pagina secondaria |
| Fund (investment advisory per VC/family office/CVC) | **REMOVE** dal percorso principale | Idem. Risposta FAQ "Rainmakers è un VC?" |
| Tribe (portfolio) | **KEEP + VERIFY** | Presentata come "Alcune realtà che hanno fatto parte della Tribe", senza claim sul ruolo di Rainmakers |
| Testimonianze | **KEEP + VERIFY** | Citazioni mantenute fedeli (non riscritte: riscrivere le parole altrui le renderebbe non autentiche). Il PRD chiede la struttura Problem → Rainmakers → Outcome: l'abbiamo applicata come *etichette di contesto* attorno alla citazione originale. Serve ri-conferma dei testimonial |
| Form "Apply / Send us your pitch" | **REWRITE** | Sostituito dal form lead unico con 3 intenti (Join / Community / Talk) |
| Form contatto per aziende/istituzioni/investitori | **REPURPOSE** | Intento "Parla con Rainmakers" + audience secondarie in "Per chi è" |
| News | **REMOVE** (V1) | Fuori scope one-page; torna con il Knowledge hub (V3) |

## 4. Classificazione contenuti — Nuvolab

| Contenuto | Decisione | Note |
|---|---|---|
| Servizi per aziende / istituzioni / investitori | **REPURPOSE** | Non trasferiti come servizi. Tradotti in "esperienza di ecosystem building" (pilastro Esperienza) |
| Track record corporate (Assolombarda, Intesa, UniCredit, Crédit Agricole…) | **VERIFY** | Utilizzabili come proof di credibilità solo con autorizzazione e dati aggiornati. In V1 non sono in pagina |
| Formazione all'imprenditorialità (iBicocca) | **VERIFY → REWRITE** | Potenziale proof per il pilastro "Conoscenza" |
| Linguaggio "innovation builder per la competitività" | **REMOVE** | Corporate/istituzionale |

## 5. Classificazione contenuti — Italian Rainforest

| Contenuto | Decisione | Note |
|---|---|---|
| Definizione "mappa e database dell'ecosistema italiano dell'innovazione" | **KEEP** | Usata quasi alla lettera (coerenza GEO tra i due siti) |
| Filosofia "ubuntu — I am because we are" | **KEEP** (breve) | Perfetta per "You don't have to build alone". Usata come citazione nella sezione Community |
| Statistiche per categoria | **KEEP** | Con data di rilevazione visibile |
| Destinatari (enabler IT/internazionali, startup IT, soft landing) | **KEEP** | Nella FAQ "Cos'è Italian Rainforest" |
| Unica review ("Community member, Innovation enabler") | **REMOVE** | Anonima: non soddisfa PRD §23 |

## 6. Gap di contenuto (nessuna fonte reale trovata)

Questi elementi sono nel sito come **placeholder espliciti** (marcati `[DA CONFERMARE]`/`TODO` in `content/shared.ts`) e vanno forniti prima del go-live:

1. File dei loghi (6 varianti) → `public/brand/`
2. Nome/i e link delle community WhatsApp private di Rainmakers e processo reale di onboarding (approvazione manuale? criteri?)
3. Numeri aggiornati di Rainmakers (membri della rete, community, eventi) — oggi in pagina non c'è alcun numero non verificato
4. Profilo LinkedIn / altri social da usare in `sameAs`
5. Email di contatto generale (usata provvisoriamente: team@rainmakers.it)
6. Conferma ragione sociale/indirizzo e testo privacy validato dal legale
