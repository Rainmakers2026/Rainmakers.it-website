-- Rainmakers.it — 0009: "Investi con noi" applications from "Come vuoi iniziare?" (2026-10-23)
--
-- Additive and re-runnable. Requires 0008.
--   • join_applications.kind gains 'invest' (entrepreneurs, managers, angels, family offices and funds applying to the
--     Rainmakers Club / Capital). Details (investor type, interest, ticket, city…) go in the existing `application`
--     jsonb; no file is ever attached.
--   • submit_join_application() is unchanged: it stores p->>'kind' as received.
--   • Until this migration is applied, /api/join stores these entries as kind 'cv' with application.track = 'invest'
--     (lib/supabase/leads.ts), so nothing is lost in the meantime.
-- Rollback: supabase/rollback/0009_down.sql

alter table public.join_applications drop constraint if exists join_applications_kind_check;
alter table public.join_applications add constraint join_applications_kind_check
  check (kind in ('pitch', 'cv', 'giveback', 'company', 'invest'));
