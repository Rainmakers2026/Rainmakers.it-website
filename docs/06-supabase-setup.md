# 06 — Supabase setup for the website forms

Applies to the Phase 4 code: "Connettiti con Rainmakers", "Join the Tribe" (pitch / CV + PDF upload)
and "Entra su WhatsApp". The newsletter is not part of this change.

## What is stored where

| Form | API route | Table (one row per submission) | Files |
|---|---|---|---|
| Connettiti con Rainmakers | `POST /api/lead` | `contact_requests` | — |
| Join the Tribe (pitch / CV) | `POST /api/join` (multipart) | `join_applications` | private bucket `join-documents`, PDF ≤ 4 MB |
| Entra su WhatsApp | `POST /api/community` | `community_requests` | — |

`leads` stays the single record per person (by email). It is only filled in, never overwritten
with empty values, and a generic profile ("other") never replaces a specific one. `lead_events` logs
every submission (attribution + the per-email limit of 5 submissions per hour).

None of these forms subscribes anyone to the newsletter or a marketing list.

## Security model

- **RLS** is enabled on every table. `anon` and `authenticated` have **no** privileges on the
  submission tables: the public cannot read, list, insert or change anything directly.
- Writes happen only in the Next.js API routes, server-side, with the **service key**, through
  `SECURITY DEFINER` functions (`submit_contact`, `submit_join_application`, `submit_community_request`)
  that only `service_role` may execute. The internal helper `rm_upsert_person` is executable by nobody
  but its owner.
- The routes validate everything again on the server (zod), check the origin, cap the body size,
  rate-limit per IP and use spam traps. Duplicate clicks/retries are absorbed by `idempotency_key`.
- **Files**: checked on the server (extension, MIME type, size and the `%PDF-` signature), stored under
  `pitch|cv/YYYY/MM/<random-uuid>.pdf` in a bucket with `public = false`, with **no** storage policies.
  There is no public URL. If the database insert fails after an upload, the file is deleted.
- Secrets are read only on the server (`lib/supabase/rest.ts` is `server-only`); nothing is prefixed
  `NEXT_PUBLIC_`. Logs contain status codes and Postgres messages, never names, emails or file names.

## 1. Environment variables (Vercel → Project → Settings → Environment Variables, and `.env.local`)

| Name | Value | Scope |
|---|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Preview + Production |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (legacy JWT) or `sb_secret_…` key | Preview + Production, **sensitive** |
| `SUPABASE_ANON_KEY` | anon or `sb_publishable_…` key (reads public communities) | Preview + Production |
| `JOIN_UPLOAD_MAX_MB` | optional, ≤ 4 (default 4) | optional |

Never set `LEADS_MOCK` in production. Without `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`:
development accepts submissions and only logs them (nothing stored); production returns an error,
so visitors are never told that an unsaved request was received.

## 2. Pre-flight (read-only)

Open the Supabase SQL editor and run `supabase/preflight/0003_check.sql`. Check that:

1. `leads`, `lead_events`, `communities` exist with RLS enabled (i.e. `0001` was applied).
   If they do not exist, apply `0001_init.sql` and `0002_lead_application.sql` first.
2. `leads.application` exists (i.e. `0002` was applied).
3. `contact_requests`, `join_applications`, `community_requests` do **not** already exist with a
   different structure. If they exist, stop and compare before going on.
4. No unexpected policy grants `anon`/`authenticated` access to `leads`, `lead_events` or `storage.objects`.
5. Note the row counts; take a backup (Database → Backups, or `pg_dump`) before continuing if
   there is real data.

## 3. Apply the migrations

In order, each one is re-runnable:

1. `supabase/migrations/0003_form_submissions.sql`
2. `supabase/migrations/0004_storage_join_documents.sql`

Either paste them into the SQL editor, or with the Supabase CLI linked to the project:
`supabase db push` (the files follow the CLI's ordered naming).

## 4. Verify

```sql
-- tables and RLS
select relname, relrowsecurity from pg_class
where relname in ('contact_requests','join_applications','community_requests');
-- no privileges for the public roles
select grantee, table_name, privilege_type from information_schema.role_table_grants
where table_name in ('contact_requests','join_applications','community_requests','leads')
  and grantee in ('anon','authenticated');                 -- expected: no rows
-- functions callable only by service_role
select routine_name, grantee from information_schema.routine_privileges
where routine_name like 'submit_%' or routine_name = 'rm_upsert_person';
-- bucket
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'join-documents';
-- expected: public = false, 4194304, {application/pdf}
```

From a terminal, with the **anon** key (expected: 401/permission errors or an empty list):

```bash
curl -s "$SUPABASE_URL/rest/v1/contact_requests?select=*" -H "apikey: $SUPABASE_ANON_KEY"
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/submit_contact" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"p":{}}'
curl -s -X POST "$SUPABASE_URL/storage/v1/object/list/join-documents" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"prefix":""}'
```

End-to-end on a Vercel Preview (with the env vars set), using test addresses only:

1. Submit "Connettiti con Rainmakers" → one row in `contact_requests`; submit again with the same
   form open (double click) → still one row.
2. Join → pitch with a small PDF → row in `join_applications` with `pitch_storage_path`; the file is in
   Storage → `join-documents/pitch/…`; opening its public URL fails.
3. Join → CV with a link only → row with `link`, no file.
4. Upload a renamed `.exe`/`.png` as `.pdf` → error "Il file deve essere un PDF", nothing stored.
5. "Entra su WhatsApp" → row in `community_requests`, the WhatsApp button appears.
6. `newsletter_subscribers` is unchanged by all of the above.

## 5. How the team reads submissions and files

Supabase dashboard → Table editor (`contact_requests`, `join_applications`, `community_requests`,
joined to `leads` by `lead_id`) and Storage → `join-documents` (download from the dashboard).
To share one file, create a **signed URL with a short expiry** from the dashboard; never make the
bucket public and never add a storage policy for it.

## 6. Rollback

- Application: redeploy the previous Vercel deployment — the database stays compatible (`submit_lead`
  from 0002 is untouched).
- Database: `supabase/rollback/0004_down.sql`, then `0003_down.sql`. Export the submission tables and
  download the files first: dropped rows and deleted files cannot be recovered.

## Open points (team decision)

- **Retention** of CVs and pitch decks (e.g. delete after N months) and who may download them —
  to be written in the privacy policy before production (the privacy page still has placeholders).
- Workflow statuses (`new` → `reviewing`/`in_progress` → …) are available in each table for the team.
