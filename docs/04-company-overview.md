# 04 — Integrazione del Company Overview (maggio 2025)

Fonte: `20250525_Rainmakers_extended.pdf` — "Rainmakers — Company Overview", Milano, maggio 2025 (70 pagine; schede Tribe e Advisory ©2023).
Il documento è materiale interno fornito da Rainmakers: i contenuti sono trattati come **VERIFIED**, con la data del dato indicata in pagina.

## Dove è finito ogni contenuto

| Slide | Contenuto | Nel sito |
|---|---|---|
| 2 | Francesco Inguscio, "Doing good, having fun, making money", LinkedIn | About → card fondatore; schema.org `founder` |
| 3 | Innovation advisor + venture builder & accelerator, dal 2011 a Milano | About → definizione (GEO) |
| 4–5 | Missione "con istruzione, imprenditoria ed innovazione", il "perché" | About → missione |
| 6 | Il "chi": team dinamico, collaboratori, partner, Tribe | About → testo |
| 7–8 | Meaningful innovation, 3 P, "il bene, fatto bene, che paga bene", citazione del fondatore | About → radici + citazione |
| 9 | Il "come": VDO con 6 business unit | Sezione **Modello** |
| 10–15 | Advisory, Investments, Club (300+), Tribe (6 exit, 14 partecipazioni), Lab (servizi aaS), Community (InnovUp) | Sezione **Modello** (una card per BU, con "Per te") |
| 13, 17–18 | Mappa del portafoglio: attive, exit, minoranza, write-off | **Track record → La Tribe** (filtri per stato) |
| 19–41 | 23 schede startup (settore, sito, FTE, fatturato, sede, anno) | **Track record → La Tribe** (card espandibili) |
| 42–70 | 28 schede di innovation advisory (cliente, tipo, sintesi, impatto, sede, anno) | **Track record → Innovation advisory** (card espandibili) |
| 16 | Email del fondatore | Non pubblicata: il contatto passa dal form (PRD v2 §48) |

Dati in `content/data/tribe.ts` e `content/data/advisory.ts`; i numeri nel copy ({exits}, {active}, {advisory}) sono calcolati dai dati.

## Note e scelte

- **Stato Tribe**: dalla slide 13 (2025). Backbone è indicata come exit nel 2025 mentre la scheda 2023 la riporta attiva: vale il 2025.
- **Minoranze** (Gellify, Startup Wise Guys, Airlite, WAMI): nel documento c'è solo il logo → descrizione `[PLACEHOLDER — CONTENT REQUIRED]`.
- **Write-off** Fornace, BidToTrip, StartupHome: descrizioni dal vecchio sito (2021).
- **FTE e fatturato**: ultimi disponibili (schede 2023), etichettati "(2023)".
- **Impatti sotto NDA o in corso**: riportati come tali.
- Le **testimonianze** restano nascoste finché non sono confermate (PRD v2 §26).
- I **loghi** di startup e clienti non sono stati estratti dal PDF: le card usano monogrammi. Per usare i loghi, aggiungere un campo `logo` ai dati con file autorizzati.
- Il PRD v2 chiede di non mettere investimenti al centro: Investments e Club compaiono solo nella sezione Modello, a metà pagina, con il punto di vista dell'imprenditore.
