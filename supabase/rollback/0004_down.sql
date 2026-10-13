-- Rollback of 0004_storage_join_documents.sql.
-- ⚠ Uploaded CVs and pitch decks cannot be recovered once deleted. Download anything needed first
--   (Storage → join-documents). Supabase refuses to delete a bucket that still contains objects:
--   empty it from the dashboard (or the Storage API) after the team has signed off, then run:

delete from storage.buckets where id = 'join-documents';
