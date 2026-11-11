# CRM "Rainmakers OS" — form, Supabase, Brevo, Airtable

Questa guida descrive il CRM introdotto l'11 novembre 2026.

- Tutti i form del sito alimentano un unico CRM su Supabase.
- C'è una sola newsletter, **Gocce di Innovazione**, con tre aree editoriali: Giveback, Open Venture Building e Advisory.
- Brevo e Airtable sono **preparati ma spenti**. Il sito non aggiunge nessuno a liste Brevo e non scrive su Airtable finché le sincronizzazioni non vengono attivate esplicitamente (vedi la sezione 9).

## Indice

| File | Contenuto |
|---|---|
| `supabase/migrations/0010_crm.sql` | Tabelle, vincoli, RLS, funzioni e vista di proiezione per Brevo. Rieseguibile e senza cancellazioni. |
| `supabase/rollback/0010_down.sql` | Rollback **distruttivo**: va usato solo con approvazione e dopo un export. |
| `supabase/tests/0010_crm.sql` | Test SQL degli scenari. Si lanciano su un progetto di **test** e fanno rollback alla fine. |
| `lib/crm/taxonomy.ts` | Valori stabili (aree, player type, settori, liste) con etichette IT/EN. |
| `lib/crm/forms.ts` | I form: id, tipo, area, campi obbligatori e versione privacy. |
| `lib/crm/schema.ts` | Validazione condivisa tra browser e server. |
| `lib/crm/sync.ts` | `syncContactToBrevo`, `syncContactToAirtable`, `syncOrganizationToAirtable` e `syncSubmissionToAirtable`, tutti spenti. |
| `docs/crm/brevo-mapping.csv` | Mapping Supabase → Brevo, esportabile. |
| `docs/crm/airtable-mapping.csv` | Mapping Supabase → Airtable, esportabile. |
| `scripts/test-crm.ts`, `scripts/test-brevo.ts` | Test delle API (`npm test`). |

## 1. Form → campi → Supabase

**Campi comuni dei form "player":**

- obbligatori: `first_name`, `last_name`, `email`, `industry`;
- facoltativi: `phone`, `job_title`, `organization_website`, `country` (codice ISO, predefinito IT), `city`, `message`;
- `organization_name` e `player_type` sono obbligatori nei form player tranne Giveback, che accoglie anche persone singole.

Le colonne si leggono così:

- **Campo specifico obbligatorio:** al massimo uno per gruppo.
- **Area:** è anche l'interesse CRM registrato sul contatto.
- **Gruppo condizionale:** il blocco di campi che compare in base al player type scelto.

| Form (card) | form_id | form_type | Area | Player type offerti | Gruppo condizionale | Campo specifico obbligatorio |
|---|---|---|---|---|---|---|
| Innova la tua azienda | `rm_company_v1` | `company_request` | advisory | tutti i 15 | Corporate/PMI (`company_size`, `innovation_objective`, `collaboration_interest`) + quello del player type | `innovation_objective` |
| Accelera la tua startup | `rm_startup_v1` | `startup_application` | open_venture_building | startup, venture builder | Startup (`startup_stage`, `funding_status`, `funding_range`, `primary_need`) | `startup_stage` + pitch deck (PDF o link) |
| Investi con noi (popup) | `rm_invest_v1` | `investor_application` | advisory | VC, CVC, family office, crowdfunding platform, BAN/club deal | Investor (`investment_ticket`, `investment_stages`, `investment_industries`, `investment_geographies`) | `investment_ticket` |
| Unisciti al Giveback | `rm_giveback_v1` | `giveback_application` | giveback | tutti (facoltativo) | quello del player type + `contribution`, `availability`, `linkedin` | `contribution` |
| Lavora con noi | `rm_job_v1` | `job_application` | — | — (fuori dal modello player) | `job_area`, `experience`, `city`, `linkedin` + CV (PDF o link) | `job_area`, `experience` |
| Gocce di Innovazione (footer, sezione finale, news) | `rm_newsletter_gdi_v1` | `newsletter_signup` | — | — | interessi editoriali (multipli, facoltativi) | email + consenso |
| Lascia una review | `rm_review_v1` | `review` | — | — | `review_id`, `rating`, `publish_consent` (il testo resta in `reviews`) | — |

I blocchi condizionali dipendono dal player type:

- **startup** → blocco Startup;
- **VC, CVC, family office, crowdfunding platform, BAN/club deal** → blocco Investor;
- **incubatore/acceleratore, venture builder/startup studio** → blocco Accelerator (`supported_stages` obbligatorio, `supported_industries`, `services_offered`).

Gli altri tipi compilano solo i campi comuni.

**Destinazione in Supabase:**

- `contacts`: anagrafica unica per email.
- `organizations`: deduplicate per dominio del sito, altrimenti per nome normalizzato ("Acme S.r.l." = "ACME srl").
- `contact_organizations`: legame contatto-organizzazione con ruolo e player type. Ogni contatto ha una sola organizzazione principale, l'ultima dichiarata.
- `organization_player_types`: tutti i tipi dichiarati per un'organizzazione.
- `form_submissions`: una riga per invio, con i campi specifici in `data` (chiavi snake_case), documento, pagina, UTM, `privacy_version`, `newsletter_opt_in`, `editorial_interests`.
- `contact_interests`: interessi per area.
- `consent_events`: storico dei consensi.
- `newsletter_subscriptions`: stato dell'iscrizione alla newsletter.

**Campi tecnici:**

- Il server li calcola dal `form_id` e ignora quelli inviati dal browser: `form_id`, `form_type`, area, `source_brand` (`rainmakers`), `privacy_version` (`lib/crm/forms.ts → PRIVACY_VERSION`) e `submitted_at` (ora del database).
- `source_page` arriva dal Referer della stessa origine.
- Gli UTM sono quelli della visita, conservati in `sessionStorage` all'arrivo.
- Il contatto conserva per sempre la **prima** provenienza (`first_form_id`, `first_source_page`, `first_utm`). Ogni richiesta ha la propria.

**Regole di qualità dei dati:**

- **Idempotenza:** la stessa chiave di invio (doppio clic o retry) non crea una seconda riga. La stessa email, anche con maiuscole diverse, aggiorna il contatto e crea solo una nuova submission.
- **Nessuna sovrascrittura con valori vuoti:** nome, telefono e ruolo si aggiornano solo se il nuovo invio li contiene.
- **Interessi editoriali:** passano a `true` solo per scelta esplicita e non vengono tolti senza una nuova scelta.
- **Disiscrizione:** resta valida finché la persona non chiede di nuovo l'iscrizione. Un form inviato senza la casella newsletter non la riattiva.
- **Newsletter:** la casella nei form è separata, facoltativa e mai preselezionata. Inviare una richiesta non iscrive nessuno.
- **Privacy:** la casella privacy riguarda solo il trattamento della richiesta (`consent_events.purpose = request_processing`). La newsletter ha un consenso a parte (`purpose = newsletter`: requested → confirmed → withdrawn).

## 2. Newsletter "Gocce di Innovazione"

1. Il form (email obbligatoria, nome e interessi facoltativi, consenso esplicito) crea `newsletter_subscriptions.status = pending_confirmation`. Il database conserva solo l'hash del token.
2. Un'email transazionale chiede la conferma. Il link scade dopo 48 ore e funziona solo con un clic sul pulsante della pagina, così gli scanner email non possono confermare al posto della persona.
3. La conferma porta lo stato a `subscribed`, invia un'email di benvenuto con il link di disiscrizione e mette il contatto in coda per Brevo, dove entrerà solo quando il sync sarà attivo.
4. **Disiscrizione:** il link firmato (`/{lingua}/newsletter/unsubscribe?c=…&t=…`, HMAC con `NEWSLETTER_LINK_SECRET`) apre una pagina con un pulsante. Lo stato passa a `unsubscribed` e si registra un evento `withdrawn`.
5. **Come testarlo:** dopo la conferma, la pagina mostra subito il link di disiscrizione personale, quindi il ciclo si prova tutto dal sito.

Rainforest Radar non esiste più: non ci sono liste, form o logiche dedicate.

## 3. Mapping Supabase → Brevo (preparato, non attivo)

Una sola lista: **`RM | Newsletter | Gocce di Innovazione`**. Ci entrano solo gli iscritti con stato `subscribed`, cioè confermati con il doppio opt-in.

| Attributo Brevo | Tipo | Origine (vista `crm_brevo_contacts`) |
|---|---|---|
| `SUPABASE_CONTACT_ID` | testo | `contacts.id` |
| `FIRSTNAME` | testo | `contacts.first_name` |
| `LASTNAME` | testo | `contacts.last_name` |
| `PLAYER_TYPE` | categoria | player type dell'organizzazione **principale** del contatto |
| `INDUSTRY` | categoria | settore dell'organizzazione principale |
| `COUNTRY` | testo (ISO) | paese dell'organizzazione principale |
| `INTEREST_GIVEBACK` | booleano | interesse editoriale Giveback |
| `INTEREST_OVB` | booleano | interesse editoriale Open Venture Building |
| `INTEREST_ADVISORY` | booleano | interesse editoriale Advisory |
| `SOURCE_FORM` | testo | `contacts.first_form_id` (prima provenienza) |
| `SOURCE_BRAND` | testo | `contacts.first_source_brand` |

**Regola di proiezione:** Brevo riceve **un** player type, **un** settore e **un** paese per contatto, presi dall'organizzazione principale, cioè l'ultima dichiarata. La relazione completa resta in Supabase: più organizzazioni nel tempo, tutti i player type dell'organizzazione, tutte le richieste.

**Interessi:** Brevo riceve solo gli interessi **editoriali**, cioè quelli scelti per la newsletter. Le aree dei form inviati restano interessi CRM e non vengono assegnate in automatico, perché una startup potrebbe voler leggere anche Advisory. Chi non indica preferenze riceve la newsletter completa.

**Segmenti dinamici** (CRM → Contacts → Segments), tutti basati sulla stessa lista:

- `GDI | Giveback` = lista Gocce + `INTEREST_GIVEBACK` = Sì
- `GDI | Open Venture Building` = lista Gocce + `INTEREST_OVB` = Sì
- `GDI | Advisory` = lista Gocce + `INTEREST_ADVISORY` = Sì
- per tipo di player e settore: lista Gocce + `PLAYER_TYPE` = valore, oppure + `INDUSTRY` = valore. Non servono liste aggiuntive.

I tre interessi sono indipendenti: lo stesso contatto può stare in tutti e tre i segmenti.

**Invio:** all'inizio una sola campagna mensile all'intera lista. I segmenti servono per le analisi e, più avanti, per i contenuti personalizzati.

**Disiscrizioni Brevo → Supabase:** sono già pronte, ma spente.

- La route `app/api/webhooks/brevo` risponde 404 finché il sync Brevo non è attivo e `BREVO_WEBHOOK_SECRET` non è impostato.
- Quando lo sono, l'evento `unsubscribed` di Brevo chiama `crm_newsletter_unsubscribe_email`.
- Brevo resta il riferimento per lo stato di invio e per le disiscrizioni fatte dalle sue email. Supabase resta la fonte principale dei dati.

## 4. Mapping Supabase → Airtable (preparato, non attivo)

Base: **`Rainmakers OS | CRM`**. Airtable è un'interfaccia operativa, non un secondo database principale. Ogni tabella ha un campo `supabase_id`, la chiave dell'upsert: un contatto che invia più form aggiorna sempre lo stesso record e non crea doppioni.

| Tabella | Origine Supabase | Campi |
|---|---|---|
| Contacts | `contacts` + organizzazione principale | `supabase_id`, Email, First name, Last name, Phone, Job title, Player type, First source form, Created at |
| Organizations | `organizations` + `organization_player_types` | `supabase_id`, Name, Website, Industry, Country, City, Player types (multi) |
| Contact Organizations | `contact_organizations` | `supabase_id` (contact_id:organization_id), Contact, Organization, Role, Player type, Primary |
| Form Submissions | `form_submissions` | `supabase_id`, Contact supabase_id, Organization supabase_id, Form id, Form type, Area, Player type, Message, Details (JSON), Status, Newsletter opt-in, Source page, UTM source / medium / campaign, Submitted at |
| Newsletter Subscriptions | `newsletter_subscriptions` | `supabase_id`, Contact, Status, Language, Consent source, Subscribed at, Confirmed at, Unsubscribed at |

Le stesse informazioni, in formato esportabile, sono in `docs/crm/airtable-mapping.csv`.

**Viste da creare in Airtable:**

| Vista | Tabella | Filtro |
|---|---|---|
| New Leads | Form Submissions | Status = new, ordinate per Submitted at (più recenti prima) |
| Giveback | Form Submissions | Area = giveback |
| Open Venture Building | Form Submissions | Area = open_venture_building |
| Advisory | Form Submissions | Area = advisory |
| Startups | Contacts | Player type = startup |
| Investors | Contacts | Player type è uno di vc, cvc, family_office, crowdfunding_platform, ban_club_deal |
| Accelerators | Contacts | Player type è uno di incubator_accelerator, venture_builder |
| Newsletter Subscribers | Newsletter Subscriptions | Status = subscribed |
| Follow-up Required | Form Submissions | Status = follow_up |

## 5. Variabili d'ambiente

| Variabile | Obbligatoria | Note |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | sì | URL pubblico, usato anche per i link nelle email |
| `SUPABASE_URL` | sì | progetto "Rainmakers OS" |
| `SUPABASE_SERVICE_ROLE_KEY` | sì | solo server, mai `NEXT_PUBLIC_` |
| `SUPABASE_ANON_KEY` | sì | letture pubbliche (communities) |
| `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_REPLY_TO` | sì | solo email transazionali |
| `NEWSLETTER_LINK_SECRET` | sì in produzione | almeno 32 caratteri casuali; senza questa variabile la disiscrizione dal link è rifiutata |
| `CRON_SECRET` | sì | job giornaliero che ritenta le email di benvenuto e di ricevuta |
| `JOIN_NOTIFY_EMAIL` | no | default info@rainmakers.it (i quattro form) |
| `FORMS_NOTIFY_EMAIL`, `NEWSLETTER_NOTIFY_EMAIL` | no | default tools@nuvolab.com |
| `CRM_SYNC_BREVO_ENABLED`, `BREVO_GDI_LIST_ID`, `BREVO_WEBHOOK_SECRET` | no (futuro) | accendono il sync Brevo |
| `CRM_SYNC_AIRTABLE_ENABLED`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` | no (futuro) | accendono il sync Airtable |

Da **rimuovere** su Vercel, perché non più usate:

- `BREVO_CONTACTS_LIST_ID`
- `AIRTABLE_PITCH_TABLE_ID`, `AIRTABLE_CV_TABLE_ID`, `AIRTABLE_GIVEBACK_TABLE_ID`, `AIRTABLE_COMPANY_TABLE_ID`
- `AIRTABLE_INVEST_TABLE_ID`, `AIRTABLE_REVIEW_TABLE_ID`, `AIRTABLE_NEWSLETTER_TABLE_ID`

## 6. Deploy su Vercel

Non va modificato il database di produzione senza approvazione: i passi 1–3 si fanno prima su un progetto di **test**.

1. Su Supabase, crea il progetto `Rainmakers OS`, oppure usa quello esistente, in regione UE.
2. Applica in ordine le migrazioni `0001` → `0010` dal SQL editor o con `supabase db push`. La `0010` si può rieseguire e non tocca le tabelle precedenti.
3. Lancia `supabase/tests/0010_crm.sql` nel SQL editor. Deve restituire "crm tests passed" e non lascia dati, perché fa rollback.
4. Su Vercel, alla voce Settings → Environment Variables, imposta le variabili della sezione 5. Genera `NEWSLETTER_LINK_SECRET` con `openssl rand -base64 48`.
5. Pubblica prima una **Preview** e verifica la checklist della sezione 8. Solo dopo promuovi in produzione.
6. Il cron giornaliero (`vercel.json`) usa `CRON_SECRET`.

**Attenzione:** questa versione del sito scrive tramite le funzioni della `0010`. Se un ambiente punta a un database dove la migrazione non è applicata, i form rispondono con un errore e non salvano nulla. La migrazione va quindi applicata **prima** del deploy.

## 7. Test

- `npm test`: validazione, API (form, newsletter, conferma, disiscrizione, cron, review), CRM con gli 8 scenari del brief, controlli dei contenuti.
- `supabase/tests/0010_crm.sql`, sul database di test:
  - nuovo contatto startup;
  - stesso contatto con secondo form;
  - organizzazione con due contatti;
  - più aree;
  - invio senza newsletter;
  - iscrizione con doppio opt-in, conferma e disiscrizione;
  - doppio invio;
  - input non validi e limite per indirizzo;
  - accesso negato ad anon e authenticated (RLS e funzioni);
  - email di ricevuta inviata una sola volta;
  - proiezione Brevo.

## 8. Checklist di verifica manuale (Preview)

- [ ] Ogni card di "Come vuoi iniziare?" apre il suo form. "Investi con noi" si apre dal link dell'Investment nell'organigramma.
- [ ] Il blocco condizionale cambia con il player type (startup / investor / incubatore). Gli altri tipi mostrano solo i campi comuni.
- [ ] Su mobile non c'è scroll orizzontale, i chip vanno a capo e si naviga da tastiera (Tab, Esc chiude).
- [ ] Un invio di prova crea una riga in `contacts`, `organizations`, `form_submissions` e `consent_events`. Arrivano l'email a info@rainmakers.it e la ricevuta alla persona.
- [ ] Un secondo invio con la stessa email non crea un secondo contatto.
- [ ] Un invio con "Gocce di Innovazione" spuntata fa arrivare l'email di conferma. Prima della conferma lo stato è `pending_confirmation`.
- [ ] La conferma porta lo stato a `subscribed` e manda l'email di benvenuto con il link di disiscrizione.
- [ ] La disiscrizione porta lo stato a `unsubscribed` e registra in `consent_events` l'azione `withdrawn`.
- [ ] Un link di disiscrizione modificato a mano viene rifiutato.
- [ ] In Brevo nessun contatto è stato aggiunto a liste. `external_sync_status` contiene solo righe `pending`.
- [ ] Le tabelle CRM non sono leggibili con la chiave anon (prova da SQL o dall'API REST: risposta vuota o 401/403).

## 9. Attivare le sincronizzazioni (in futuro)

**Prima di attivare:**

1. Crea in Brevo la lista e gli attributi della sezione 3.
2. Crea la base Airtable con tabelle e viste della sezione 4.
3. Confronta disiscrizioni e blocchi già presenti in Brevo: non vanno riattivati contatti già disiscritti.
4. Per la prima sincronizzazione, esporta da Supabase e importa in Airtable usando gli UUID. In Brevo importa **solo** gli iscritti confermati (`select * from crm_brevo_contacts where in_newsletter_list`).

**Worker:**

- Va scritto come Supabase Edge Function su Database Webhook, oppure come cron Vercel.
- Legge da `external_sync_status` le righe `pending` e `failed` con `attempts < 5`.
- Carica il record: la vista `crm_brevo_contacts` per Brevo, le tabelle per Airtable.
- Chiama la funzione di `lib/crm/sync.ts`, che registra l'esito con `crm_record_sync`.

**Eventi che mettono in coda** (già attivi nel database):

- nuovo invio: contatto, organizzazione e submission per Airtable;
- conferma e disiscrizione: contatto per Brevo, iscrizione per Airtable;
- interessi aggiunti da un iscritto: contatto per Brevo.

**Come gestire i casi:**

- **Aggiornamenti:** l'upsert usa `supabase_id` per Airtable e l'email per Brevo.
- **Cancellazioni** (richiesta GDPR): cancellare il contatto in Supabase (cascade sulle tabelle collegate), poi rimuoverlo a mano da Airtable e da Brevo.
- **Errori:** la riga resta `failed` con `last_error` e viene ritentata.
- **Disiscrizioni:**
  - verso Brevo: il contatto viene tolto dalla lista, mai cancellato;
  - da Brevo: tramite il webhook descritto nella sezione 3.
