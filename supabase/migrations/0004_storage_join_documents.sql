-- Rainmakers.it — 0004: private bucket for "Join the Tribe" pitch decks and CVs (PRD §10.4)
--
-- Re-runnable. Rollback: supabase/rollback/0004_down.sql
--   • public = false: no public URL ever works for these files
--   • Supabase itself enforces the limits as a second line of defence (the API route checks first):
--     PDF only, max 4 MB (keep in sync with lib/uploads.ts and JOIN_UPLOAD_MAX_MB)
--   • NO policies on storage.objects for this bucket: anon/authenticated users can neither list,
--     read nor write. Only the server (service role, which bypasses RLS) uploads; the team reads the
--     files from the Supabase dashboard (Storage → join-documents) or via short-lived signed URLs.
--     Do not add a public or "authenticated" policy for this bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('join-documents', 'join-documents', false, 4194304, array['application/pdf'])
on conflict (id) do update set
  public             = false,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
