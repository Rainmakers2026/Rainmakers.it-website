# 07 — Brevo: newsletter double opt-in and welcome emails

Phase 5. Requires the Supabase setup in `06-supabase-setup.md` (migrations 0001–0004) plus
migration `0005_newsletter_brevo.sql`.

## Flows

**Newsletter (double opt-in)**

1. The visitor enters an email and ticks the newsletter consent → `POST /api/newsletter`.
2. Server: validates and lower-cases the email, then `newsletter_subscribe()` stores/updates the row in
   `newsletter_subscribers` as `pending`, with `consent_at`, `consent_version`, `source` and the
   **hash** of a one-time token (valid 48 h).
3. A transactional **confirmation email** is sent through Brevo (`/v3/smtp/email`). Nobody is added
   to a list at this point.
4. The link opens `/{it|en}/newsletter/confirm?token=…`. The person clicks **Conferma / Confirm**
   (a POST — mail scanners that pre-open links cannot confirm by themselves).
5. `newsletter_confirm()` sets `confirmed` + `confirmed_at` (consent evidence). Then:
   - the contact is added to the Brevo list **"Contatti"** (`/v3/contacts`, `updateEnabled: true`);
   - the **welcome email** is sent once (atomic claim on `welcome_sent_at`).
6. Brevo problems never undo a confirmed subscription: failures are recorded (`brevo_sync_status`,
   `brevo_last_error`, attempts) and retried by the daily job.

| Case | What the visitor sees | Emails |
|---|---|---|
| New address | "Quasi fatto: controlla la tua email" | 1 confirmation |
| Pending, confirmation sent < 10 min ago | "Ti abbiamo appena inviato l’email…" | none |
| Pending, older / previous send failed / unsubscribed | as new (new token) | 1 confirmation |
| Already confirmed | "Questo indirizzo è già iscritto" | none |
| Confirmation email could not be sent | "Abbiamo registrato la richiesta, ma… riprova" (HTTP 503) | none — the visitor retries |
| Link clicked twice | "Iscrizione già confermata" | no second welcome |
| Link expired | "Il link è scaduto, iscriviti di nuovo" | none |

**Join the Tribe** — after a new (non-duplicate) application is saved, one transactional
"application received" email (pitch or CV wording, IT/EN). Failures never affect the saved
application and are retried for 2 days.

**Not changed**: "Connettiti con Rainmakers" and "Entra su WhatsApp" send no email and never reach
Brevo. Internal notifications to info@rainmakers.it are planned for a later phase.

## Configuration (names only — values in Vercel and `.env.local`, never in Git)

| Variable | Notes |
|---|---|
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys. Sensitive. |
| `BREVO_CONTACTS_LIST_ID` | Numeric id of the list **Contatti** (Contacts → Lists). |
| `BREVO_FROM_EMAIL` | Verified sender (Brevo → Senders, domains & dedicated IPs). |
| `BREVO_FROM_NAME` | e.g. `Rainmakers`. |
| `BREVO_REPLY_TO` | e.g. `info@rainmakers.it`. |
| `CRON_SECRET` | Long random string; Vercel Cron sends it as `Authorization: Bearer …`. |
| `NEXT_PUBLIC_SITE_URL` | Base of the confirmation link. On a Preview, set it to the preview URL or leave it empty (the deployment URL is used). |

The approved approach is the Brevo **HTTP API** (one key for transactional emails and contacts);
the `BREVO_SMTP_*` variables listed as examples in the PRD are not needed.

Without `BREVO_API_KEY`/`BREVO_FROM_EMAIL`: in development nothing is sent (logged as mock); in
production the subscription is saved and the visitor is told the confirmation email failed — the
site never claims an email was sent.

## Brevo-side setup

1. Authenticate the sending domain (SPF, DKIM, DMARC) in Brevo → *Senders, domains & dedicated IPs*.
   DNS for rainmakers.it is managed outside this project (currently the WordPress host).
2. Create/locate the list **Contatti**, copy its id into `BREVO_CONTACTS_LIST_ID`.
3. Check the plan limits (Brevo Free: 300 emails/day, shared by confirmations and welcome emails).
4. Newsletter campaigns sent from Brevo carry Brevo's unsubscribe link. Unsubscribes happen in Brevo;
   `newsletter_subscribers.status` is not updated automatically (possible later improvement: Brevo
   webhook → `unsubscribed`).

## Apply and verify

1. Supabase SQL editor: run `supabase/migrations/0005_newsletter_brevo.sql`.
   It marks rows created by the previous code (`confirmed` without double opt-in) as
   `brevo_sync_status = 'skipped'`: they are **not** sent to Brevo automatically. Decide separately.
2. Set the variables above in Vercel (Preview first) and redeploy the Preview.
3. With a **test address you control**: subscribe → confirmation email arrives (check sender, reply-to,
   language) → click → confirm → the address appears in Brevo list *Contatti*, one welcome email
   arrives. Subscribe again → "già iscritto", no email. Click the link again → "già confermata", no email.
4. Join the Tribe with a test address → one "candidatura ricevuta" email; the address is **not** in
   *Contatti*. Submit the contact form → no email, not in *Contatti*.
5. Retry job: `curl -H "Authorization: Bearer $CRON_SECRET" https://<preview>/api/cron/brevo-retry`
   → `{"ok":true,"synced":…,"welcomed":…}`. In production it runs daily at 07:00 UTC (`vercel.json`).

Rollback: `supabase/rollback/0005_down.sql` (drops consent-evidence columns — export first);
contacts already in Brevo stay there.
