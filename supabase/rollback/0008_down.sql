-- Rollback of 0008_giveback_applications.sql.
-- Existing giveback and company rows are kept and relabelled 'cv' (tagged application.track = their old kind),
-- so the old check holds.

update public.join_applications
  set application = coalesce(application, '{}'::jsonb) || jsonb_build_object('track', kind),
      kind = 'cv'
  where kind in ('giveback', 'company');
alter table public.join_applications drop constraint if exists join_applications_kind_check;
alter table public.join_applications add constraint join_applications_kind_check
  check (kind in ('pitch', 'cv'));
