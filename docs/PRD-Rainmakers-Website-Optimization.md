# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## RAINMAKERS.IT — Website Optimization, Conversion & Integrations

**Versione:** 2.0 — RPD Edits  
**Data:** 12 ottobre 2026  
**Tipologia:** Evoluzione del sito esistente, ottimizzazione CRO, content redesign e integrazioni  
**Ambiente di sviluppo:** VS Code + Claude Code  
**Repository:** GitHub collegato a Claude Code — verificare il repository effettivamente aperto prima di intervenire  
**Framework e deployment:** Next.js / React / TypeScript / Vercel, da verificare sull'implementazione esistente  
**Backend:** Supabase  
**Email marketing e SMTP:** Brevo Free  
**Lingue:** Italiano e inglese  
**Priorità:** Conversione, chiarezza del posizionamento, credibilità, raccolta dati e qualità dell'esperienza utente

---

# 1. CONTESTO E LINK DI RIFERIMENTO

Prima di iniziare, verifica il repository aperto in VS Code, la branch attiva, gli ultimi commit, gli ambienti Vercel e le integrazioni configurate.

Utilizza i seguenti link come riferimenti ufficiali del progetto.

| Risorsa | Link | Utilizzo |
|---|---|---|
| Homepage italiana locale | http://localhost:3000/it | Pagina principale da modificare |
| Sezione Rainforest | http://localhost:3000/it#rainforest | Verifica della sezione dedicata a Italian Rainforest |
| Join the Tribe | http://localhost:3000/it/join | Form di candidatura e caricamento pitch/CV |
| Italian Innovation Map | https://italian-innovation-map.vercel.app/it | Riferimento per Italian Rainforest |
| Video di Francesco Inguscio | https://youtu.be/v_fRsxaAzyU?feature=shared | Video da incorporare direttamente nella homepage |
| Reference visual 1 | https://dribbble.com/shots/27793350-Mandate-AI-agents-for-vendor-risk | Riferimento per infografiche, animazioni e visualizzazione dei processi |
| Reference visual 2 | https://dribbble.com/shots/27793350-Mandate-AI-agents-for-vendor-risk | Stesso riferimento, condiviso due volte nel brief originale |
| Deploy e preview | Dashboard Vercel collegata al progetto | Verifica dei deployment e dei relativi URL |

Per il sito pubblico, individua l'URL di produzione effettivamente associato al progetto Vercel. Non presumere che il dominio di produzione coincida con l'URL di preview.

## 1.1 Modalità di lavoro richiesta

Claude Code deve operare sul progetto esistente, sfruttando gli strumenti e i collegamenti disponibili.

- **VS Code:** ispezionare e modificare i file reali del progetto.
- **GitHub:** utilizzare il repository e la cronologia esistenti, preservando il lavoro già svolto.
- **Vercel:** eseguire controlli e creare una preview verificabile prima del deployment definitivo.
- **Supabase:** verificare lo schema, le policy, le tabelle e le integrazioni esistenti.
- **Brevo:** verificare la configurazione SMTP e le credenziali disponibili tramite variabili d'ambiente.

Non ricreare repository, progetti Supabase o progetti Vercel se esistono già.

Non sovrascrivere file, migrazioni, variabili d'ambiente o configurazioni senza averne prima verificato il contenuto.

Non esporre segreti, API key, token GitHub, service-role key di Supabase o credenziali SMTP nel codice client, nei log, nei commit o nelle risposte HTTP.

---

# 2. OBIETTIVO DEL PROGETTO

Trasformare Rainmakers.it in una homepage più chiara, autorevole, visivamente coinvolgente e orientata alla conversione.

Il sito deve comunicare in pochi secondi:

1. Che cos'è Rainmakers.
2. A chi si rivolge.
3. Quale valore concreto offre a imprenditori e startup.
4. Perché vale la pena fidarsi del progetto.
5. Come entrare in contatto, partecipare alla community o approfondire l'ecosistema.

Il principale obiettivo commerciale è acquisire contatti qualificati da giovani imprenditori, founder, startupper e aziende in crescita.

Una parte significativa del traffico potenziale proviene da eventi come Startup Weekend, durante i quali Francesco Inguscio si presenta, tiene lezioni e offre consulenze. Il sito deve quindi funzionare anche per un utente che conosce già Francesco, ma non ha mai sentito parlare di Rainmakers.

Il percorso desiderato è:

**Evento o referral → Homepage → Comprensione del valore → Prova di credibilità → Azione → Lead qualificato.**

La homepage non deve limitarsi a raccontare una storia interessante: deve facilitare una decisione.

## 2.1 Priorità

**P0 — Indispensabile**
- Chiarezza del posizionamento.
- Riduzione del testo.
- Credibilità di Francesco e di Rainmakers.
- Form funzionanti e dati persistenti.
- Correzione delle email e dei link.
- Responsività e accessibilità.
- Sicurezza delle integrazioni.

**P1 — Importante**
- Infografiche e animazioni.
- Sezione Italian Rainforest rinnovata.
- Video incorporato.
- Audit SEO/GEO.
- Miglioramento delle icone aziendali.
- Tracciamento delle conversioni.

**P2 — Da completare nella stessa evoluzione se fattibile, altrimenti da documentare per una fase successiva**
- Sistema collaborativo di annotazione del sito live.
- Raffinamenti visuali e animazioni secondarie.
- Ulteriori ottimizzazioni non essenziali al percorso di conversione.

Le funzionalità P0 devono essere completate e verificate prima di considerare il lavoro concluso.

---

# 3. STRATEGIA DI POSIZIONAMENTO

## 3.1 Definizione di Rainmakers

Rainmakers deve essere presentato come un ecosistema che connette imprenditori, competenze, conoscenze, community e opportunità per sostenere la crescita delle aziende.

Il sito non deve far percepire Rainmakers esclusivamente come:
- un fondo di investimento;
- un incubatore;
- un acceleratore;
- una società di consulenza tradizionale;
- una semplice community online.

Il posizionamento deve valorizzare l'interazione tra persone, esperienza, relazioni e opportunità.

## 3.2 Relazione tra Rainmakers e Italian Rainforest

Mantenere una distinzione inequivocabile.

**Rainmakers**
- Il brand principale.
- Le persone, l'esperienza e le relazioni.
- La community e l'accesso a conoscenze e opportunità.
- Il punto di contatto per imprenditori e founder.

**Italian Rainforest**
- La mappa e il database dell'ecosistema italiano dell'innovazione.
- Uno strumento per scoprire organizzazioni, aziende e attori dell'ecosistema.
- Un progetto collegato, con una propria identità visiva e un proprio sito.

**Community WhatsApp**
- Il livello di interazione continuativa.
- Conversazioni, networking, condivisione di conoscenze e opportunità.

Il rapporto deve essere comprensibile anche per chi non conosce nessuno dei tre progetti.

Non spostare il focus della homepage su Italian Rainforest: la sua sezione deve supportare il posizionamento di Rainmakers, non sostituirlo.

---

# 4. AUDIT INIZIALE OBBLIGATORIO

Prima di modificare il codice, eseguire un audit tecnico e contenutistico.

## 4.1 Analisi del repository

Identificare e documentare:
- framework e versioni;
- struttura delle cartelle;
- sistema di routing;
- gestione delle traduzioni italiano/inglese;
- componenti della homepage;
- componenti e validazioni dei form;
- gestione delle immagini e dei loghi;
- configurazione Supabase;
- configurazione Brevo;
- integrazioni e webhook;
- eventi analytics;
- configurazione SEO;
- deployment Vercel;
- stato delle modifiche Git.

Individuare i componenti riutilizzabili prima di crearne di nuovi.

## 4.2 Audit del copy esistente

Creare un inventario delle sezioni attuali, dei relativi testi, delle CTA e dei collegamenti.

Classificare ogni elemento in una delle seguenti categorie:

- KEEP: mantenere;
- REWRITE: riscrivere;
- SHORTEN: ridurre;
- MERGE: unire a un'altra sezione;
- REMOVE: eliminare;
- VERIFY: verificare prima della pubblicazione.

Il risultato deve essere una homepage più essenziale, non una homepage che nasconde lo stesso testo in accordion, tooltip o sezioni secondarie.

## 4.3 Protezione del lavoro esistente

Prima di intervenire:
1. Controllare `git status`.
2. Non cancellare o sovrascrivere modifiche non committate appartenenti ad altri sviluppatori.
3. Identificare la branch e i commit recenti.
4. Creare una branch dedicata alle modifiche, se coerente con il workflow esistente.
5. Verificare le dipendenze già installate prima di aggiungerne altre.

Non eseguire operazioni distruttive su Git, Supabase o Vercel.

---

# 5. CONTENT DESIGN E RIDUZIONE DEL COPY

## 5.1 Obiettivo di riduzione

Ridurre di circa il **60% il volume del testo visibile nella homepage italiana**, utilizzando come baseline il testo effettivamente presente prima dell'intervento.

Il target indicativo è quindi mantenere circa il 40% delle parole della homepage attuale.

Il confronto deve considerare il testo visibile della pagina, distinguendolo da:
- footer e navigazione;
- testi necessari per privacy e consenso;
- etichette dei form;
- contenuti accessibili tramite FAQ o accordion;
- contenuti presenti in pagine separate, come Join.

Non sacrificare chiarezza, informazioni necessarie o credibilità per raggiungere una riduzione numerica.

## 5.2 Principi di copywriting

Adottare un copy:
- diretto;
- concreto;
- orientato ai bisogni del founder;
- credibile e verificabile;
- sintetico;
- umano;
- ambizioso senza essere enfatico;
- orientato a un'azione chiara.

Utilizzare principi di persuasione e psicologia della decisione in modo etico:
- rendere immediatamente riconoscibile il problema;
- spiegare il valore in termini di benefici;
- ridurre l'incertezza;
- utilizzare prove reali;
- chiarire il passo successivo;
- evitare sovraccarico cognitivo.

Non utilizzare falsi elementi di urgenza, scarsità inventata, testimonianze fabricate o promesse di risultati garantiti.

## 5.3 Gerarchia dei messaggi

La homepage deve seguire questo ordine:

1. **Proposta di valore:** che cosa fa Rainmakers e per chi.
2. **Beneficio:** perché può essere utile a un imprenditore.
3. **Prova:** esperienza di Francesco, video, progetti e asset verificabili.
4. **Meccanismo:** come il network può aiutare a trovare conoscenze, persone e opportunità.
5. **Community:** come partecipare.
6. **Italian Rainforest:** accesso alla mappa e al database.
7. **CTA finale:** entrare in contatto o richiedere accesso.

Non introdurre sezioni che non abbiano una funzione strategica precisa.

## 5.4 Direzione del copy

Utilizzare i seguenti esempi come base da adattare al contenuto reale.

**Hero — Headline di riferimento**

> Non devi costruire la tua impresa da solo.

**Subheadline di riferimento**

> Rainmakers connette imprenditori, competenze e opportunità per aiutarti a fare il prossimo passo.

**CTA primaria**

> Entra in Rainmakers

**CTA secondaria**

> Scopri come possiamo aiutarti

**Sezione di credibilità**

> L'esperienza conta. Le connessioni giuste possono fare la differenza.

**Sezione community**

> Le idee crescono quando incontrano le persone giuste.

**Sezione Italian Rainforest**

> Scopri le persone e le organizzazioni che stanno costruendo l'innovazione in Italia.

Questi testi sono proposte editoriali, non affermazioni fattuali. Claude Code deve adattarli alla struttura effettiva del sito e verificare che descrivano accuratamente le attività reali.

## 5.5 Gestione della homepage in inglese

Mantenere la versione `/en` coerente con la versione italiana.

Non tradurre meccanicamente espressioni italiane se risultano innaturali in inglese.

Il posizionamento, le CTA e i contenuti di prova devono mantenere lo stesso significato commerciale nelle due lingue.

---

# 6. VALORIZZAZIONE DI FRANCESCO INGUSCIO

## 6.1 Obiettivo

Rafforzare la credibilità di Rainmakers valorizzando Francesco Inguscio come figura riconoscibile, competente ed esperta nell'imprenditorialità e nell'innovazione.

La sua esperienza deve essere utilizzata per spiegare perché Rainmakers può essere rilevante per chi sta costruendo un'impresa.

La comunicazione deve promuovere Rainmakers attraverso la persona, senza trasformare l'intero sito in un semplice profilo personale.

## 6.2 Nuova sezione founder-centric

Creare o riorganizzare una sezione dedicata a Francesco.

La sezione deve contenere:

1. Un'immagine circolare placeholder per il volto.
2. Un titolo forte che colleghi esperienza e valore per gli imprenditori.
3. Un testo sintetico, orientato ai problemi dei founder.
4. Il video YouTube incorporato.
5. Eventuali prove di competenza già presenti negli asset e verificabili.
6. Una CTA che riconduca a Rainmakers.

### Placeholder del volto

Creare un'immagine circolare vuota, ben proporzionata, pronta per essere sostituita con una fotografia ufficiale.

Requisiti:
- forma circolare;
- dimensioni responsive;
- rapporto 1:1;
- trattamento visivo coerente con il brand;
- nessun volto generato o attribuito a Francesco;
- supporto per la futura sostituzione dell'immagine senza modificare il layout.

Se nel repository è già presente una fotografia ufficiale e il suo utilizzo è appropriato, verificare prima con il team se possa essere utilizzata. In assenza di conferma, mantenere il placeholder.

### Copy indicativo

Titolo:

> L'esperienza prende valore quando diventa utile agli altri.

Testo:

> Costruire un'impresa significa affrontare decisioni, ostacoli e opportunità in continua evoluzione. Rainmakers nasce per avvicinare imprenditori, competenze ed esperienze che possono contribuire al percorso di crescita di chi costruisce il futuro.

CTA:

> Scopri Rainmakers

Questo testo deve essere affinato in base ai materiali reali. Non attribuire a Francesco risultati, ruoli, numeri, titoli o collaborazioni non documentati.

## 6.3 Utilizzo del materiale allegato

Esaminare tutti gli asset effettivamente disponibili nel repository e negli allegati accessibili.

Per ogni materiale:
- verificarne il contenuto;
- individuarne il valore comunicativo;
- distinguere fatti verificabili da claim promozionali;
- selezionare gli elementi utili alla credibilità di Rainmakers;
- trasformare testi lunghi in microcopy, didascalie, punti chiave o visual;
- utilizzare le prove più rilevanti nella sezione founder e nelle altre sezioni appropriate.

**Escludere il materiale dedicato specificamente a Italian Rainforest dalla sezione di Francesco/Rainmakers**, poiché sarà utilizzato nella sezione dedicata a Italian Rainforest.

Non inventare loghi, testimonianze, risultati o statistiche per riempire spazi vuoti.

Se un asset menzionato nel brief non è accessibile, segnalarlo nel report finale e predisporre un placeholder appropriato.

## 6.4 Incorporamento del video

Video di riferimento:

https://youtu.be/v_fRsxaAzyU?feature=shared

Incorporare il video direttamente nella homepage, all'interno della sezione founder.

Requisiti:
- visualizzazione tramite player incorporato;
- nessuna apertura obbligatoria di una nuova scheda o pagina YouTube;
- layout responsive;
- rapporto 16:9;
- caricamento ottimizzato;
- placeholder o thumbnail prima dell'attivazione del player, quando possibile;
- titolo accessibile e descrittivo;
- nessuna riproduzione automatica con audio;
- utilizzo della modalità privacy-enhanced di YouTube, se compatibile con l'implementazione;
- gestione del consenso ai contenuti esterni quando richiesta dalla configurazione privacy del sito.

Utilizzare un iframe sicuro, con attributi appropriati e senza parametri che consentano funzionalità non necessarie.

L'incorporamento non deve compromettere la velocità di caricamento della pagina.

---

# 7. DESIGN SYSTEM E IDENTITÀ VISIVA

## 7.1 Colori

Mantenere l'identità cromatica già utilizzata nel sito.

Non sostituire i colori del brand con quelli della reference Dribbble.

Colori di riferimento disponibili nel progetto:

- `#1b3a5c`
- `#7b92e8`
- `#4b61d1`
- `#2596be`

Prima di intervenire, verificare gli effettivi token CSS, le variabili e gli eventuali colori già utilizzati dal sito. Se esistono ulteriori colori ufficiali, preservarli.

Utilizzare i colori con una gerarchia coerente:
- sfondi e superfici;
- testi e contrasti;
- elementi interattivi;
- grafici e nodi;
- evidenziazioni;
- focus e stati.

Non applicare i quattro colori indiscriminatamente a ogni componente.

## 7.2 Tipografia

Mantenere la tipografia esistente, verificandone leggibilità e gerarchia.

Se il progetto utilizza già Roboto, preservarla salvo una motivazione concreta per cambiarla.

Evitare:
- testi troppo piccoli;
- paragrafi eccessivamente lunghi;
- titoli con gerarchie incoerenti;
- contrasto insufficiente;
- animazioni che rendano il testo difficile da leggere.

## 7.3 Reference Dribbble

Utilizzare la reference:

https://dribbble.com/shots/27793350-Mandate-AI-agents-for-vendor-risk

come ispirazione per:
- visualizzazione dei flussi;
- infografiche;
- relazioni tra elementi;
- nodi e connessioni;
- gerarchia delle informazioni;
- card;
- animazioni e microinterazioni;
- rappresentazione visiva di processi complessi.

Non copiare letteralmente layout, branding, asset o contenuti.

La direzione creativa deve tradurre questi principi nell'identità Rainmakers, mettendo in evidenza persone, competenze, relazioni e opportunità.

---

# 8. INFOGRAFICHE E ANIMAZIONI

## 8.1 Obiettivo

Sostituire parte dei blocchi di testo con rappresentazioni visive che aiutino il visitatore a capire più velocemente come funziona Rainmakers.

Le infografiche devono spiegare concetti, non essere semplici decorazioni.

## 8.2 Infografica principale: il valore del network

Realizzare una rappresentazione visuale della relazione tra:

- People;
- Knowledge;
- Community;
- Opportunities;
- Ecosystem;
- Growth.

Il visual può essere una rete di nodi connessi, con un nodo centrale dedicato all'imprenditore e collegamenti verso gli altri elementi.

Animazione suggerita:
1. compare il nodo centrale;
2. appaiono progressivamente le connessioni;
3. vengono evidenziati i diversi elementi;
4. le connessioni si stabilizzano in una rete coerente.

Non simulare metriche, performance o relazioni reali che non siano supportate da dati.

## 8.3 Infografica secondaria: come funziona Rainmakers

Rappresentare sinteticamente il percorso:

**Connect → Learn → Discover → Collaborate → Grow**

Utilizzare icone, microcopy e animazioni leggere per rendere immediato il processo.

Non trasformare questo percorso in una promessa di risultati garantiti.

## 8.4 Animazioni

Preferire:
- transizioni di ingresso leggere;
- animazioni SVG;
- evidenziazioni al passaggio del mouse;
- microinterazioni sulle CTA;
- progressione visiva delle connessioni;
- transizioni tra stati;
- animazioni basate su viewport, dove realmente utili.

Evitare:
- scroll hijacking;
- animazioni continue che distraggono;
- effetti pesanti;
- animazioni che impediscono l'accesso al contenuto;
- grandi quantità di JavaScript per effetti ottenibili con CSS o SVG.

Supportare `prefers-reduced-motion`.

Su dispositivi mobili, ridurre la complessità delle animazioni quando necessario.

---

# 9. SEZIONE ITALIAN RAINFOREST

## 9.1 Naming

Il titolo della sezione deve essere esattamente:

**Italian Rainforest**

Non utilizzare il titolo generico “Rainforest”.

La sezione deve essere chiaramente distinta dalle altre parti della homepage, mantenendo però la coerenza con il brand principale.

## 9.2 Obiettivo

Presentare Italian Rainforest come uno strumento per esplorare l'ecosistema italiano dell'innovazione.

Il suo compito è aiutare l'utente a comprendere che esiste una mappa più ampia di persone e organizzazioni con cui può entrare in relazione.

## 9.3 Direzione visiva

Utilizzare come riferimento:

https://italian-innovation-map.vercel.app/it

e, se necessario, la versione inglese:

https://italian-innovation-map.vercel.app/en

Studiare:
- loghi;
- colori;
- immagini;
- linguaggio visivo;
- concetto di ecosistema;
- forme e metafore della rainforest;
- modalità di rappresentazione delle connessioni.

### Background

È previsto un file immagine in formato WebP dedicato alla rainforest, non disponibile al momento della stesura del PRD.

Prima di generare o modificare asset:
1. cercare nel repository e nelle cartelle degli asset;
2. verificare eventuali allegati disponibili;
3. individuare il file corretto, se presente;
4. non utilizzare immagini casuali come sostituzione definitiva.

Se l'immagine non è disponibile, predisporre un componente con un riferimento asset facilmente sostituibile e un fallback coerente con il brand.

Quando il file sarà disponibile, utilizzarlo come background della sezione mantenendolo riconoscibile.

Requisiti:
- contrasto sufficiente tra sfondo e testo;
- eventuale overlay solo se necessario per la leggibilità;
- nessuna alterazione che renda l'immagine irriconoscibile;
- adattamento a desktop, tablet e mobile;
- attenzione al peso del file e al caricamento.

## 9.4 Copy

Headline di riferimento:

> Scopri l'ecosistema dietro le connessioni.

Descrizione:

> Italian Rainforest è la mappa dell'ecosistema italiano dell'innovazione: uno strumento per esplorare persone e organizzazioni e scoprire nuove possibilità di connessione.

CTA:

> Esplora Italian Rainforest

Link:

https://italian-innovation-map.vercel.app/it

Aprire il link in modo coerente con l'esperienza del sito e utilizzare un link esterno sicuro se si sceglie una nuova scheda.

Non implementare in questa fase un nuovo database, una nuova mappa o una nuova interfaccia completa di Italian Rainforest.

Il focus di questo intervento rimane Rainmakers.it.

---

# 10. FORM, SUPABASE E RACCOLTA DATI

## 10.1 Principio generale

Supabase deve rimanere il database proprietario per i dati raccolti attraverso il sito.

Prima di creare tabelle o modificare gli schemi, effettuare un audit del database esistente.

Verificare:
- tabelle e colonne;
- relazioni;
- indici;
- vincoli;
- policy RLS;
- bucket Storage;
- eventuali trigger;
- funzioni;
- configurazioni esistenti.

Riutilizzare gli schemi esistenti quando sono compatibili con i requisiti.

Non creare tabelle duplicate con nomi diversi per raccogliere gli stessi dati.

## 10.2 Form da gestire

Devono essere funzionanti e integrati con Supabase:

1. Join the Tribe, con pitch e CV.
2. Popup di iscrizione alla newsletter.
3. Form “Connettiti con Rainmakers”.
4. Form “Entra su WhatsApp”.
5. Eventuali form di contatto presenti nella homepage.

Ogni form deve:
- validare i campi;
- validare lato server;
- gestire errori e invii duplicati;
- salvare i dati nel database;
- restituire un messaggio di conferma;
- gestire gli errori senza perdere i dati inseriti;
- essere accessibile e utilizzabile da mobile.

## 10.3 Modello dati

Adeguare la struttura alle tabelle esistenti.

Se necessario, utilizzare una struttura equivalente alla seguente.

### Tabella `leads`

Campi indicativi:
- `id`
- `first_name`
- `last_name`
- `email`
- `company`
- `role`
- `website`
- `linkedin`
- `company_stage`
- `main_challenge`
- `interests`
- `source`
- `consent`
- `created_at`
- `updated_at`

### Tabella `community_requests`

Campi indicativi:
- `id`
- `lead_id`
- `community`
- `status`
- `created_at`

### Tabella `contact_requests`

Campi indicativi:
- `id`
- `lead_id`
- `message`
- `status`
- `created_at`

### Tabella `newsletter_subscribers`

Campi indicativi:
- `id`
- `email`
- `first_name`
- `last_name`, se richiesto
- `consent`
- `consent_timestamp`
- `source`
- `brevo_sync_status`
- `created_at`
- `updated_at`

### Tabella `join_applications`

Campi indicativi:
- `id`
- `lead_id`
- `pitch_storage_path`
- `cv_storage_path`
- `status`
- `created_at`

### Estensione per le annotazioni

Valutare una tabella dedicata, ad esempio `site_annotations`, descritta nella sezione 14.

Questi schemi sono indicativi. Non applicarli automaticamente se il database esistente presenta già strutture equivalenti.

## 10.4 Upload di pitch e CV

Il form Join the Tribe deve permettere il caricamento dei file richiesti.

Utilizzare Supabase Storage se già previsto o se compatibile con l'architettura.

Requisiti:
- validazione dei formati;
- limite di dimensione configurabile;
- controllo server-side;
- nomi file sicuri;
- percorsi di storage non prevedibili;
- bucket privato per documenti personali;
- accesso limitato ai soggetti autorizzati;
- nessun link pubblico permanente a CV o pitch privati;
- registrazione nel database dei riferimenti ai file.

Non salvare i file direttamente in campi testuali del database.

Se il caricamento di un file riesce ma il salvataggio del record fallisce, gestire il caso evitando file orfani quando possibile.

Se un invio non è completato, mostrare un errore chiaro e consentire all'utente di riprovare.

## 10.5 Sicurezza Supabase

Non utilizzare la `service_role` key nel browser.

Le scritture devono avvenire attraverso endpoint server-side sicuri o il meccanismo già presente, con validazione e policy adeguate.

Abilitare RLS sulle tabelle esposte tramite API.

Non permettere al visitatore pubblico di leggere indiscriminatamente dati personali di altri utenti.

Le policy devono essere coerenti con il tipo di dato e con il processo operativo del team.

---

# 11. BREVO: NEWSLETTER, CONTATTI E WELCOME EMAIL

## 11.1 Newsletter

Il popup di iscrizione alla newsletter deve salvare i dati in Supabase e, per i contatti idonei, sincronizzarli con la lista Brevo denominata:

**Contatti**

Il database Supabase è la fonte primaria per la raccolta e la registrazione dell'iscrizione.

La sincronizzazione con Brevo deve avvenire server-side, senza esporre la API key al browser.

Il processo deve:
1. validare l'indirizzo email;
2. registrare l'iscrizione in Supabase;
3. registrare il consenso richiesto;
4. inviare il contatto a Brevo secondo la configurazione disponibile;
5. aggiornare lo stato di sincronizzazione;
6. gestire eventuali errori e tentativi successivi.

La sincronizzazione con Brevo non deve cancellare un'iscrizione valida da Supabase in caso di errore temporaneo.

Prevedere una gestione degli invii ripetuti per evitare duplicazioni e mantenere i dati coerenti.

Non aggiungere contatti alla lista marketing senza il consenso appropriato.

Non implementare ora segmentazioni avanzate o liste multiple: sono previste in una fase successiva.

## 11.2 Form di suggerimento o contatto

Per il form di suggerimento e per il form “Connettiti con Rainmakers”:

- salvare i dati in Supabase;
- non inviare automaticamente i contatti alla lista marketing Brevo;
- non iscrivere automaticamente il mittente alla newsletter;
- utilizzare `info@rainmakers.it` come destinatario delle notifiche, se è prevista una notifica email;
- mantenere distinta la richiesta di contatto dal consenso marketing.

## 11.3 Welcome email tramite SMTP Brevo

Implementare una welcome email transazionale utilizzando l'SMTP di Brevo.

La welcome email:
- deve essere inviata dal server;
- non deve richiedere l'inserimento del destinatario nella lista marketing;
- non deve essere usata per iscrivere implicitamente l'utente a una newsletter;
- deve avere mittente, nome mittente e reply-to configurabili;
- deve gestire errori e logging senza registrare informazioni sensibili non necessarie.

Inserire l'invio nella logica server-side, dopo aver verificato il corretto salvataggio del dato.

La welcome email deve essere inviata solo per gli eventi per cui è effettivamente prevista, evitando invii multipli a ogni refresh o retry.

Le credenziali SMTP devono essere conservate nelle variabili d'ambiente Vercel e locali, mai nel repository.

Se le credenziali o il mittente verificato non sono disponibili, predisporre il codice e documentare le variabili necessarie, senza simulare un invio riuscito.

---

# 12. CONTATTI E LINK ALLE EMAIL

Effettuare una ricerca nel repository per individuare ogni occorrenza dell'indirizzo:

`italianrainforest@rainmakers.it`

Sostituire con:

`info@rainmakers.it`

La sostituzione riguarda almeno:
- footer;
- sezione Contatti;
- form di contatto;
- eventuali notifiche email;
- configurazioni e costanti condivise;
- testi visibili;
- eventuali riferimenti nei componenti di entrambe le lingue.

Verificare anche i link `mailto:`.

Non modificare eventuali riferimenti storici o archiviati che non hanno alcuna funzione operativa senza prima verificarne il contesto.

Dopo le modifiche, verificare che non rimangano occorrenze attive dell'indirizzo precedente nelle funzionalità del sito.

---

# 13. SUBSTACK

Dove il sito rimanda al blog Substack, sostituire il nome visualizzato:

**Francesco Inguscio → Italian Rainmaker**

Mantenere invariato l'URL del blog, salvo che l'audit riveli un collegamento non funzionante o una destinazione errata.

Non modificare altri riferimenti a Francesco Inguscio: la sostituzione riguarda esclusivamente il nome associato al link Substack.

Verificare il comportamento del collegamento su desktop e mobile.

---

# 14. SISTEMA DI ANNOTAZIONE COLLABORATIVA DEL SITO LIVE

## 14.1 Obiettivo

Dopo la pubblicazione su Vercel, predisporre un sistema che permetta al team di aggiungere note e commenti direttamente sul sito live, con un'esperienza simile alle annotazioni di Figma.

I commenti devono rimanere salvati e recuperabili anche dopo un refresh della pagina.

Non è sufficiente un semplice overlay che mantenga le note soltanto nello stato locale del browser.

## 14.2 Funzionalità richieste

Prevedere:
- modalità annotazione attivabile;
- possibilità di selezionare un punto o un elemento della pagina;
- creazione di un commento;
- associazione del commento a un riferimento della pagina;
- visualizzazione dei commenti esistenti;
- persistenza tramite Supabase;
- indicatore visivo dei commenti;
- possibilità di risolvere o archiviare un commento;
- autore e timestamp;
- gestione degli errori;
- comportamento responsive.

Il sistema deve consentire di annotare sezioni, testi, immagini e componenti, senza alterare accidentalmente i contenuti del sito.

## 14.3 Architettura suggerita

Implementare un componente isolato, ad esempio:

`SiteAnnotationLayer`

e una tabella dedicata, se necessaria:

`site_annotations`

Campi indicativi:
- `id`
- `page_path`
- `element_selector`
- `anchor_data`
- `comment`
- `author_id`
- `status`
- `created_at`
- `updated_at`

L'ancoraggio può utilizzare un identificatore stabile del componente o della sezione e, quando necessario, coordinate relative normalizzate.

Non fare affidamento esclusivamente sulle coordinate assolute dello schermo: devono essere gestite le variazioni di viewport e layout.

## 14.4 Sicurezza e accesso

Le annotazioni sono uno strumento interno al team.

Non consentire a visitatori anonimi di inserire, leggere o modificare liberamente annotazioni interne.

Prevedere un meccanismo di autenticazione o autorizzazione riservato al team, compatibile con l'infrastruttura esistente.

Le policy RLS devono limitare la lettura e la scrittura ai soggetti autorizzati.

Non inserire una password condivisa o un token segreto direttamente nel bundle client.

Non esporre le annotazioni interne al pubblico per errore.

## 14.5 Modalità di attivazione

La modalità annotazione deve essere attivabile solo per utenti autorizzati.

Se tecnicamente opportuno, supportare una modalità di revisione separata, senza alterare il comportamento ordinario del sito per i visitatori.

Il sistema deve funzionare sul dominio di produzione e, quando utile, sulla preview Vercel.

Se l'implementazione completa richiede autenticazione, configurazioni o decisioni del team non ancora disponibili, predisporre il componente, documentare i prerequisiti e non dichiarare la funzionalità completata finché non è stata testata end-to-end.

---

# 15. FAVICON E LOGHI DELLE AZIENDE

## 15.1 Obiettivo

Migliorare la leggibilità dei favicon nelle icone aziendali delle sezioni:
- The Tribe;
- Innovation Advisory.

## 15.2 Requisiti

Verificare il rendering attuale delle icone aziendali.

Migliorare:
- dimensione percepita del logo;
- leggibilità a dimensioni ridotte;
- allineamento;
- rapporto tra logo e contenitore;
- contrasto;
- coerenza visiva tra le aziende;
- comportamento responsive.

Non deformare i loghi.

Non ingrandire tutti i favicon con una regola universale se le proporzioni originali differiscono.

Utilizzare, quando appropriato:
- `object-fit: contain`;
- contenitori con dimensioni coerenti;
- sfondo neutro o coerente con il brand;
- padding regolabile per tipologia di logo;
- fallback per favicon non disponibili.

Preferire gli asset ufficiali già presenti nel progetto.

Non sostituire favicon mancanti con loghi inventati.

Verificare anche il contrasto tra loghi chiari, scuri e sfondi colorati.

---

# 16. RESPONSIVE DESIGN

Il sito deve essere completamente responsive su:
- desktop;
- tablet;
- mobile.

La responsività non deve consistere semplicemente nel ridimensionare la versione desktop.

## 16.1 Desktop

Ottimizzare:
- gerarchia dei contenuti;
- leggibilità;
- distribuzione tra testo e visual;
- sezione founder e video;
- infografiche;
- navigazione;
- CTA;
- sezione Italian Rainforest.

## 16.2 Tablet

Verificare:
- layout a una o due colonne;
- riduzione degli spazi;
- proporzioni delle immagini;
- larghezza delle card;
- disposizione delle infografiche;
- comportamento dei menu;
- leggibilità delle CTA.

## 16.3 Mobile

Priorità:
1. proposta di valore;
2. benefici;
3. credibilità;
4. community;
5. Italian Rainforest;
6. conversione.

Prevedere:
- CTA facilmente accessibili;
- form semplici da compilare;
- pulsanti sufficientemente grandi;
- video adattabile allo schermo;
- immagini ottimizzate;
- infografiche comprensibili senza hover;
- animazioni ridotte;
- nessuno scroll orizzontale indesiderato.

Verificare almeno viewport di riferimento da 360 px, 390 px, 768 px, 1024 px e 1440 px, oltre ai breakpoint già presenti nel progetto.

---

# 17. SEO E GEO AUDIT

## 17.1 Obiettivo

Effettuare un audit completo della homepage e delle pagine interessate, ottimizzando sia la SEO tradizionale sia la GEO, intesa come Generative Engine Optimization.

Non limitarsi a modificare title e meta description.

## 17.2 SEO on-page

Verificare e ottimizzare:
- title;
- meta description;
- H1 e gerarchia dei titoli;
- heading duplicati;
- contenuto testuale;
- link interni;
- link esterni;
- attributi `alt`;
- URL canonici;
- sitemap;
- robots directives;
- Open Graph;
- immagini;
- performance;
- indicizzabilità;
- pagine 404;
- redirect;
- dati strutturati.

Mantenere le URL esistenti salvo necessità dimostrata.

Non introdurre redirect inutili o duplicazioni di contenuti.

## 17.3 SEO italiano e inglese

Verificare:
- `/it`;
- `/en`;
- `/it/join` e la corrispondente pagina inglese, se presente.

Le due versioni devono avere contenuti, metadata e canonical corretti per lingua.

Implementare o correggere `hreflang` e alternate URL quando appropriato.

Evitare canonical che puntino sistematicamente alla lingua sbagliata.

## 17.4 GEO

Rendere il contenuto facilmente interpretabile e citabile dai motori di ricerca e dai sistemi di risposta generativa.

Interventi:
- definizione chiara di Rainmakers nei primi paragrafi;
- descrizione esplicita del pubblico;
- spiegazione precisa dei servizi e delle attività reali;
- distinzione chiara tra Rainmakers e Italian Rainforest;
- informazioni di contatto coerenti;
- FAQ concise;
- dati strutturati coerenti con il contenuto visibile;
- collegamenti alle fonti ufficiali;
- uso di nomi propri e denominazioni consistenti.

Non introdurre keyword stuffing, testo nascosto o contenuti generati esclusivamente per manipolare i risultati.

Non esiste uno score GEO universale garantito. L'obiettivo è migliorare la comprensione del brand, la qualità semantica e la possibilità di recupero delle informazioni.

## 17.5 Dati strutturati

Verificare se siano appropriati:
- `Organization`;
- `WebSite`;
- `WebPage`;
- `Person`, se coerente con la sezione dedicata a Francesco;
- `FAQPage`, solo se conforme alle regole applicabili e al contenuto effettivamente presente.

Non inserire dati non verificati quali:
- founding date;
- numero di startup;
- numero di utenti;
- partnership;
- risultati commerciali;
- qualifiche professionali.

Validare i dati strutturati prima del deploy.

## 17.6 Audit report

Produrre un report con:
- problemi identificati;
- modifiche applicate;
- priorità residue;
- metadata aggiornati;
- eventuali dati mancanti;
- risultati dei controlli;
- eventuali limitazioni che impediscono una valutazione completa.

Non dichiarare un punteggio SEO/GEO “eccellente” senza misurazioni e criteri espliciti.

---

# 18. ANALYTICS E MISURAZIONE DELLE CONVERSIONI

Verificare il sistema analytics già presente prima di aggiungere nuove dipendenze.

Tracciare almeno gli eventi pertinenti:
- `page_view`;
- `hero_cta_click`;
- `rainforest_cta_click`;
- `community_cta_click`;
- `contact_cta_click`;
- `lead_form_start`;
- `lead_form_submit`;
- `community_request`;
- `whatsapp_click`;
- `newsletter_signup`;
- `join_application_submit`;
- `video_play`;
- `scroll_25`;
- `scroll_50`;
- `scroll_75`;
- `scroll_90`.

Non registrare email, CV, pitch, messaggi personali o altri dati identificativi negli eventi analytics.

Rispettare il sistema di consenso e le impostazioni privacy già presenti.

## 18.1 KPI

Monitorare:
- visite alla homepage;
- CTR delle CTA;
- tasso di avvio e completamento dei form;
- tasso di conversione newsletter;
- richieste di accesso alla community;
- lead qualificati;
- conversioni da traffico proveniente da eventi;
- click verso Italian Rainforest;
- engagement con il video.

Non inventare benchmark di settore per dichiarare un miglioramento.

Se esiste una baseline, confrontare i risultati prima e dopo il deploy.

---

# 19. ACCESSIBILITÀ E PRIVACY

## 19.1 Accessibilità

Implementare:
- HTML semantico;
- gerarchia corretta degli heading;
- navigazione da tastiera;
- focus visibile;
- label associate ai campi;
- messaggi di errore accessibili;
- contrasto sufficiente;
- testi alternativi;
- supporto per reduced motion;
- attributi ARIA appropriati;
- controlli accessibili per il player video.

## 19.2 Privacy e gestione dei dati

Verificare le informative e le modalità di consenso esistenti.

Non introdurre nuove finalità di trattamento senza aggiornare le informative appropriate.

Distinguere:
- richiesta di contatto;
- richiesta di accesso alla community;
- iscrizione alla newsletter;
- caricamento di CV e pitch;
- annotazioni interne.

Non trattare automaticamente tutte queste azioni come consenso marketing.

Non inserire dati personali o documenti privati in log pubblici o in sistemi analytics.

---

# 20. ARCHITETTURA E QUALITÀ DEL CODICE

## 20.1 Principi

- Riutilizzare componenti esistenti.
- Separare copy e logica quando l'architettura lo consente.
- Mantenere la compatibilità con italiano e inglese.
- Utilizzare TypeScript in modo coerente con il progetto.
- Evitare duplicazioni.
- Non introdurre dipendenze non necessarie.
- Preservare le integrazioni funzionanti.
- Utilizzare componenti server e client secondo le esigenze reali del framework.

## 20.2 Struttura indicativa

La struttura esistente deve avere la precedenza su questa proposta.

```text
app/
  [locale]/
    page.tsx
    join/
      page.tsx

components/
  layout/
  sections/
  founder/
  infographics/
  rainforest/
  forms/
  newsletter/
  annotations/
  ui/

lib/
  supabase/
  brevo/
  validation/
  analytics/

content/
  it/
  en/

public/
  images/
  logos/
  icons/
```

Non riorganizzare l'intero repository soltanto per conformarlo a questo esempio.

## 20.3 Gestione delle variabili d'ambiente

Verificare la configurazione esistente e documentare le variabili necessarie.

Esempi indicativi, da adattare all'implementazione:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
BREVO_SMTP_PASSWORD=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=
BREVO_REPLY_TO=

BREVO_API_KEY=
BREVO_CONTACTS_LIST_ID=
```

Utilizzare soltanto le variabili effettivamente necessarie.

La API key Brevo serve per le operazioni che utilizzano le API; non sostituisce automaticamente le credenziali SMTP.

Non utilizzare nomi di variabili inventati senza verificare le convenzioni già presenti nel progetto.

Le variabili pubbliche devono contenere esclusivamente valori destinati al client.

Non stampare valori segreti nei report o nel terminale condiviso.

---

# 21. TEST E VERIFICA

## 21.1 Test funzionali

Verificare manualmente e, quando possibile, tramite test automatizzati:

- navigazione homepage;
- CTA;
- link interni ed esterni;
- sezione Italian Rainforest;
- video incorporato;
- Join the Tribe;
- caricamento pitch e CV;
- newsletter;
- form di contatto;
- form WhatsApp;
- salvataggio su Supabase;
- sincronizzazione Brevo;
- welcome email;
- errori di validazione;
- gestione dei duplicati;
- sistema di annotazione, se implementato;
- lingua italiana e inglese.

## 21.2 Test di sicurezza

Verificare:
- assenza di chiavi segrete nel bundle client;
- policy RLS;
- accesso ai documenti caricati;
- protezione dei form da abusi;
- validazione server-side;
- accesso alle annotazioni;
- gestione sicura degli errori;
- assenza di esposizione non autorizzata di dati personali.

## 21.3 Test responsive

Controllare almeno le viewport indicate nella sezione 16, testando le pagine interessate e i flussi di conversione.

## 21.4 Performance

Ottimizzare:
- immagini;
- font;
- caricamento del video;
- animazioni;
- bundle JavaScript;
- componenti client;
- richieste non necessarie;
- layout shift.

Target indicativo: Lighthouse Performance superiore a 90, quando realisticamente ottenibile.

Registrare i punteggi effettivi, senza dichiarare il target raggiunto se non è stato misurato.

## 21.5 Test delle email

Utilizzare indirizzi di test controllati.

Verificare:
- corretta ricezione;
- mittente;
- reply-to;
- contenuto;
- invii duplicati;
- gestione degli errori;
- registrazione dello stato.

Non inviare email promozionali reali durante i test senza autorizzazione.

---

# 22. GITHUB E VERCEL: WORKFLOW DI DEPLOYMENT

Claude Code deve sfruttare i collegamenti già configurati con GitHub e Vercel.

## 22.1 Prima delle modifiche

- Verificare repository e branch.
- Controllare lo stato del working tree.
- Identificare l'ambiente di produzione.
- Verificare le configurazioni esistenti.
- Non modificare il dominio di produzione.
- Non eseguire operazioni distruttive.

## 22.2 Durante lo sviluppo

- Implementare le modifiche in modo incrementale.
- Eseguire i controlli dopo ogni gruppo di interventi.
- Utilizzare il sistema di lint, type-check e test già presente.
- Correggere gli errori introdotti.
- Mantenere una separazione chiara tra sviluppo e produzione.

## 22.3 Preview Vercel

Creare o aggiornare una preview Vercel utilizzando il workflow collegato al repository.

Verificare che la preview:
- sia accessibile;
- utilizzi le variabili d'ambiente corrette;
- possa comunicare con Supabase;
- gestisca correttamente le integrazioni;
- non esponga dati reali non necessari;
- sia verificabile dal team.

Non condividere un URL di preview non verificato.

## 22.4 Produzione

Il deploy di produzione deve avvenire solo dopo:
- test funzionali;
- verifica responsive;
- verifica delle integrazioni;
- controllo SEO;
- approvazione del team, se richiesta dal workflow.

Non forzare il deploy su produzione se mancano credenziali, configurazioni o approvazioni necessarie.

Non eseguire push diretti sulla branch protetta o modifiche alle impostazioni di produzione senza autorizzazione.

## 22.5 Report di deployment

Al termine, comunicare:
- branch utilizzata;
- commit creati, se presenti;
- URL della preview;
- URL di produzione verificato;
- test eseguiti;
- eventuali errori;
- integrazioni funzionanti;
- integrazioni da configurare;
- elementi rimasti in sospeso.

Distinguere sempre tra implementazione, test e pubblicazione effettiva.

---

# 23. CRITERI DI ACCETTAZIONE

Il progetto può essere considerato completato quando sono soddisfatti i seguenti requisiti.

### Copy e posizionamento
- [ ] La homepage definisce chiaramente Rainmakers.
- [ ] Il pubblico principale è riconoscibile.
- [ ] Il volume di testo visibile è stato ridotto di circa il 60%, con confronto documentato.
- [ ] Le CTA sono coerenti e orientate alla conversione.
- [ ] Il copy non contiene promesse o prove inventate.

### Founder e credibilità
- [ ] È presente un placeholder circolare per il volto di Francesco.
- [ ] La sezione founder valorizza l'esperienza con materiali verificati.
- [ ] Il video è incorporato e responsive.
- [ ] Il materiale relativo a Italian Rainforest è mantenuto fuori dalla sezione founder.

### Design
- [ ] I colori del brand sono preservati.
- [ ] Sono presenti infografiche con una funzione esplicativa.
- [ ] Le animazioni non ostacolano la lettura.
- [ ] I favicon di The Tribe e Innovation Advisory sono più leggibili.
- [ ] La sezione Italian Rainforest è visivamente distinguibile.

### Form e integrazioni
- [ ] Join the Tribe salva correttamente i dati e i riferimenti ai file.
- [ ] I file sono accessibili soltanto agli utenti autorizzati.
- [ ] La newsletter salva i dati su Supabase.
- [ ] I contatti idonei sono sincronizzati con Brevo Contatti.
- [ ] I form di contatto non iscrivono automaticamente gli utenti al marketing.
- [ ] La welcome email utilizza l'SMTP Brevo senza richiedere l'iscrizione a una lista marketing.
- [ ] Gli errori sono gestiti correttamente.

### Contatti e collegamenti
- [ ] L'indirizzo operativo è `info@rainmakers.it`.
- [ ] Il nome visualizzato per Substack è Italian Rainmaker.
- [ ] I link di Italian Rainforest sono corretti.

### SEO, accessibilità e responsive
- [ ] Le pagine italiane e inglesi hanno metadata coerenti.
- [ ] I link canonici e hreflang sono corretti, dove applicabili.
- [ ] I dati strutturati sono validi e verificabili.
- [ ] Il sito funziona su desktop, tablet e mobile.
- [ ] I controlli di accessibilità essenziali sono superati.

### Annotazioni
- [ ] Le note vengono salvate su un database persistente.
- [ ] I commenti rimangono disponibili dopo un refresh.
- [ ] L'accesso è limitato al team autorizzato.
- [ ] Il sistema è stato testato sul dominio previsto oppure le dipendenze mancanti sono documentate.

### Deployment
- [ ] Il codice supera i controlli disponibili.
- [ ] La preview Vercel è verificata.
- [ ] Il deploy di produzione è avvenuto soltanto dopo l'approvazione prevista.
- [ ] È stato prodotto un report finale con risultati e limitazioni.

---

# 24. ORDINE DI ESECUZIONE

Claude Code deve procedere nell'ordine seguente.

**Fase 1 — Audit**
- Analizzare repository, copy, componenti, integrazioni e ambiente.
- Identificare asset disponibili e asset mancanti.
- Verificare Supabase e Brevo.
- Documentare problemi e dipendenze.

**Fase 2 — Content e conversione**
- Ridurre il copy.
- Definire la gerarchia delle sezioni.
- Migliorare le CTA.
- Rafforzare la proposta di valore.
- Valorizzare Francesco con prove reali.

**Fase 3 — Design**
- Aggiornare la sezione founder.
- Incorporare il video.
- Creare infografiche e animazioni.
- Migliorare la leggibilità delle icone aziendali.
- Ridisegnare Italian Rainforest.

**Fase 4 — Integrazioni**
- Verificare e completare i form.
- Implementare o correggere i salvataggi Supabase.
- Configurare la sincronizzazione newsletter con Brevo.
- Implementare la welcome email SMTP.
- Verificare sicurezza e gestione degli errori.

**Fase 5 — Annotazioni**
- Implementare il sistema collaborativo.
- Configurare autorizzazioni e persistenza.
- Testare la funzionalità sul sito previsto.

**Fase 6 — SEO, responsive e QA**
- Eseguire l'audit SEO/GEO.
- Testare desktop, tablet e mobile.
- Verificare accessibilità e performance.
- Eseguire test funzionali e di sicurezza.

**Fase 7 — Preview e deployment**
- Pubblicare una preview.
- Eseguire i controlli end-to-end.
- Richiedere approvazione, se prevista.
- Procedere al deployment definitivo.
- Consegnare il report finale.

Se una fase è bloccata da un asset o da una credenziale mancante, proseguire sulle attività indipendenti e documentare il blocco senza simulare risultati.

---

# 25. OUTPUT FINALI RICHIESTI A CLAUDE CODE

Al termine, fornire:

1. Elenco dei file creati e modificati.
2. Sintesi delle modifiche applicate alla homepage.
3. Copy finale italiano e inglese, oppure riferimenti ai file in cui è stato aggiornato.
4. Confronto del volume di testo prima e dopo.
5. Elenco delle modifiche alle infografiche, alle animazioni e ai componenti visuali.
6. Stato delle integrazioni Supabase.
7. Stato della sincronizzazione Brevo e della welcome email.
8. Stato del sistema di annotazione collaborativa.
9. Risultati dell'audit SEO/GEO.
10. Risultati dei test funzionali, responsive, di sicurezza e performance.
11. Variabili d'ambiente mancanti, senza riportare i relativi valori segreti.
12. Eventuali migrazioni SQL create e istruzioni per applicarle in sicurezza.
13. URL della preview Vercel verificata.
14. URL di produzione, soltanto se effettivamente pubblicato.
15. Elenco dei problemi residui e delle azioni necessarie da parte del team.

Non limitarsi a spiegare che cosa andrebbe fatto: implementare le modifiche possibili nel repository reale, verificare il funzionamento e segnalare con precisione ciò che richiede un intervento esterno.

---

# 26. PRINCIPIO GUIDA FINALE

Ogni modifica deve essere valutata in base a una domanda:

**Questa scelta aiuta un imprenditore a capire più velocemente il valore di Rainmakers, a fidarsi del progetto e a compiere il prossimo passo?**

Se una sezione, un'animazione o un testo non contribuisce alla comprensione, alla credibilità o alla conversione, deve essere semplificato o eliminato.

Rainmakers è il protagonista. Francesco ne rafforza la credibilità. Italian Rainforest amplia la prospettiva sull'ecosistema. Le community trasformano la scoperta in partecipazione.

Il risultato deve essere un sito essenziale nei testi, distintivo nella comunicazione visiva, credibile nelle promesse e affidabile nella raccolta dei dati.

**Fine del PRD.**