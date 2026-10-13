-- Rollback of 0006_site_annotations.sql.
-- ⚠ Deletes all internal annotations and the team allowlist. Export site_annotations first if needed.
-- Auth users invited for the tool remain in Supabase Auth (remove them there if required).

drop table if exists public.site_annotations;
drop function if exists public.rm_site_annotations_guard();
drop function if exists public.rm_is_team_admin();
drop function if exists public.rm_is_team_member();
drop table if exists public.team_members;
