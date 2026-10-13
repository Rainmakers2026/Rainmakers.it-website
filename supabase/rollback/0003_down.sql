-- Rollback of 0003_form_submissions.sql.
-- ⚠ Drops the submission tables and their rows. Export them first (Table editor → Export to CSV)
--   if any real submission exists. The previous application version keeps working without them
--   (it only uses submit_lead from 0002).

drop function if exists public.submit_community_request(jsonb);
drop function if exists public.submit_join_application(jsonb);
drop function if exists public.submit_contact(jsonb);
drop function if exists public.rm_upsert_person(jsonb, text);

drop table if exists public.community_requests;
drop table if exists public.join_applications;
drop table if exists public.contact_requests;

alter table public.lead_events drop column if exists kind;
alter table public.leads drop column if exists last_submission_at;
alter table public.leads drop column if exists source;

-- company / role / last_name stay nullable on purpose: restoring NOT NULL fails if rows created by
-- the WhatsApp form have no value. Restore only after checking:
--   select count(*) from public.leads where company is null or role is null or last_name is null;
--   alter table public.leads alter column company set not null;   -- etc.
