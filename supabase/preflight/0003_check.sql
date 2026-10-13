-- Run in the Supabase SQL editor BEFORE applying 0003/0004. Read-only: it changes nothing and
-- returns no personal data (structure and row counts only). Compare the output with
-- docs/06-supabase-setup.md → "Pre-flight: what to look for".

-- 1. Tables in public, with RLS status
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2. Columns of the tables this migration touches or creates
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('leads', 'lead_events', 'communities', 'contact_requests', 'join_applications', 'community_requests')
order by table_name, ordinal_position;

-- 3. Row counts (numbers only)
select 'leads' as table_name, count(*) from public.leads
union all select 'lead_events', count(*) from public.lead_events
union all select 'communities', count(*) from public.communities;

-- 4. Leads with a pitch application stored by 0002 (kept as is; new submissions go to join_applications)
select count(*) as leads_with_application from public.leads where application is not null;

-- 5. Existing policies in public and storage
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('public', 'storage')
order by 1, 2, 3;

-- 6. Functions this migration creates or relies on
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('submit_lead', 'rm_upsert_person', 'submit_contact', 'submit_join_application', 'submit_community_request')
order by 1;

-- 7. Existing storage buckets
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
