-- Rollback of 0009_invest_applications.sql.
-- Existing invest rows are kept and relabelled 'cv' (tagged application.track = 'invest'), so the 0008 check holds.

update public.join_applications
  set application = coalesce(application, '{}'::jsonb) || jsonb_build_object('track', kind),
      kind = 'cv'
  where kind = 'invest';
alter table public.join_applications drop constraint if exists join_applications_kind_check;
alter table public.join_applications add constraint join_applications_kind_check
  check (kind in ('pitch', 'cv', 'giveback', 'company'));
