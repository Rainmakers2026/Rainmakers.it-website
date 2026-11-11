-- Rainmakers.it — 0008: "Unisciti al giveback" and "Innova la tua azienda" requests from "Come vuoi iniziare?" (2026-10-21)
--
-- Additive and re-runnable. Requires 0003 (join_applications).
--   • join_applications.kind gains 'giveback' (people offering their time and skills to help Rainmakers grow) and
--     'company' (companies asking for an innovation project). Their details go in the existing `application` jsonb;
--     no file is ever attached (the file/kind constraint already allows that).
--   • submit_join_application() is unchanged: it stores p->>'kind' as received.
--   • Until this migration is applied, /api/join stores these entries as kind 'cv' with
--     application.track = 'giveback' | 'company' (lib/supabase/leads.ts), so nothing is lost in the meantime.
-- Rollback: supabase/rollback/0008_down.sql

alter table public.join_applications drop constraint if exists join_applications_kind_check;
alter table public.join_applications add constraint join_applications_kind_check
  check (kind in ('pitch', 'cv', 'giveback', 'company'));
