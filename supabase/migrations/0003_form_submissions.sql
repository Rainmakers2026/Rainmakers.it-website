-- Rainmakers.it — 0003: one row per form submission (PRD §10.2–10.5)
--
-- Additive and re-runnable. Requires 0001 and 0002. Run supabase/preflight/0003_check.sql first.
--   • leads stays the single person record (one row per email) and is no longer overwritten with blanks
--   • every submission gets its own row: contact_requests, join_applications, community_requests
--   • idempotency_key makes double clicks / network retries harmless
--   • RLS on, no access for anon/authenticated; writes only through SECURITY DEFINER functions
--     granted to service_role (called by the Next.js API routes, never from the browser)
--   • submit_lead() from 0002 is kept unchanged so a previous deployment keeps working (rollback safety)
-- Rollback: supabase/rollback/0003_down.sql

-- ─────────────────────────────────────────────────────────────
-- leads: person record — relax fields not every form collects, add attribution
-- ─────────────────────────────────────────────────────────────
alter table public.leads alter column last_name drop not null;  -- the WhatsApp form asks first name + email only
alter table public.leads alter column company drop not null;
alter table public.leads alter column role drop not null;
alter table public.leads add column if not exists source text check (source is null or char_length(source) <= 40);
alter table public.leads add column if not exists last_submission_at timestamptz;

alter table public.lead_events add column if not exists kind text check (kind is null or kind in ('contact', 'join', 'community'));

-- ─────────────────────────────────────────────────────────────
-- contact_requests — "Connettiti con Rainmakers" (no marketing consent implied)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contact_requests (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  profile_type     text not null check (profile_type in ('founder','startup','investor','corporate','innovation_professional','other')),
  company          text check (char_length(company) <= 120),
  role             text check (char_length(role) <= 120),
  link             text check (char_length(link) <= 300),
  message          text check (char_length(message) <= 1000),
  language         text not null check (language in ('it','en')),
  utm              jsonb not null default '{}'::jsonb,
  idempotency_key  uuid not null unique,
  status           text not null default 'new' check (status in ('new','in_progress','answered','archived')),
  created_at       timestamptz not null default now()
);
create index if not exists contact_requests_lead_idx on public.contact_requests (lead_id, created_at desc);
create index if not exists contact_requests_created_idx on public.contact_requests (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- join_applications — "Join the Tribe": pitch or CV, file in the private bucket and/or a link
-- ─────────────────────────────────────────────────────────────
create table if not exists public.join_applications (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.leads(id) on delete cascade,
  kind                text not null check (kind in ('pitch','cv')),
  application         jsonb,                                   -- structured pitch fields (startup, sector, service…)
  company             text check (char_length(company) <= 150),
  role                text check (char_length(role) <= 120),
  link                text check (char_length(link) <= 300),   -- pitch deck / CV / LinkedIn URL
  notes               text check (char_length(notes) <= 1000),
  pitch_storage_path  text check (pitch_storage_path ~ '^pitch/[0-9]{4}/[0-9]{2}/[0-9a-f-]{36}\.pdf$'),
  cv_storage_path     text check (cv_storage_path ~ '^cv/[0-9]{4}/[0-9]{2}/[0-9a-f-]{36}\.pdf$'),
  file_name           text check (char_length(file_name) <= 120),  -- sanitised original name, for the team
  file_size           integer check (file_size is null or file_size between 1 and 4194304),
  language            text not null check (language in ('it','en')),
  utm                 jsonb not null default '{}'::jsonb,
  idempotency_key     uuid not null unique,
  status              text not null default 'new' check (status in ('new','reviewing','contacted','archived')),
  created_at          timestamptz not null default now(),
  constraint join_applications_file_matches_kind check (
    (kind = 'pitch' and cv_storage_path is null) or (kind = 'cv' and pitch_storage_path is null)
  ),
  constraint join_applications_file_or_link check (
    coalesce(pitch_storage_path, cv_storage_path, link) is not null
  )
);
create index if not exists join_applications_lead_idx on public.join_applications (lead_id, created_at desc);
create index if not exists join_applications_created_idx on public.join_applications (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- community_requests — "Entra su WhatsApp" (one row per person and community)
-- No FK to communities: the site may list the static fallback when the table is still empty.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.community_requests (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  community_slug   text not null check (community_slug ~ '^[a-z0-9-]{1,60}$'),
  language         text not null check (language in ('it','en')),
  utm              jsonb not null default '{}'::jsonb,
  status           text not null default 'link_shown' check (status in ('link_shown','joined','rejected','archived')),
  created_at       timestamptz not null default now(),
  unique (lead_id, community_slug)
);
create index if not exists community_requests_created_idx on public.community_requests (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: nothing is readable or writable by anon / authenticated
-- ─────────────────────────────────────────────────────────────
alter table public.contact_requests   enable row level security;
alter table public.join_applications  enable row level security;
alter table public.community_requests enable row level security;
revoke all on public.contact_requests, public.join_applications, public.community_requests from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- rm_upsert_person(p, kind) — internal: person upsert without blank overwrites,
-- per-email rate limit (5 submissions / hour) and attribution log. Not callable from the API.
-- ─────────────────────────────────────────────────────────────
create or replace function public.rm_upsert_person(p jsonb, p_kind text) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_recent  int;
  v_lang    text := coalesce(nullif(p->>'language', ''), 'it');
begin
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  insert into public.leads as l (
    first_name, last_name, email, company, role, website_or_linkedin, profile_type,
    language, consent, consent_version, consent_at, utm, source, last_submission_at
  ) values (
    p->>'first_name', nullif(p->>'last_name', ''), p->>'email',
    nullif(p->>'company', ''), nullif(p->>'role', ''), nullif(p->>'link', ''),
    coalesce(nullif(p->>'profile_type', ''), 'other'),
    v_lang, true, p->>'consent_version', now(), coalesce(p->'utm', '{}'::jsonb), p_kind, now()
  )
  on conflict (email) do update set
    first_name          = excluded.first_name,
    last_name           = coalesce(excluded.last_name, l.last_name),
    company             = coalesce(excluded.company, l.company),
    role                = coalesce(excluded.role, l.role),
    website_or_linkedin = coalesce(excluded.website_or_linkedin, l.website_or_linkedin),
    -- 'other' never replaces a more specific profile given earlier
    profile_type        = case when excluded.profile_type = 'other' then l.profile_type else excluded.profile_type end,
    language            = excluded.language,
    consent             = true,
    consent_version     = excluded.consent_version,
    consent_at          = now(),
    last_submission_at  = now()
    -- utm and source keep first-touch attribution; every touch is in lead_events
  returning id into v_lead_id;

  select count(*) into v_recent
  from public.lead_events
  where lead_id = v_lead_id and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.lead_events (lead_id, language, utm, kind)
  values (v_lead_id, v_lang, coalesce(p->'utm', '{}'::jsonb), p_kind);

  return v_lead_id;
end $$;
revoke all on function public.rm_upsert_person(jsonb, text) from public, anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- submit_contact(p) → { request_id, duplicate }
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_contact(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key     uuid := (p->>'idempotency_key')::uuid;
  v_id      uuid;
  v_lead_id uuid;
begin
  select id into v_id from public.contact_requests where idempotency_key = v_key;
  if v_id is not null then
    return jsonb_build_object('request_id', v_id, 'duplicate', true);
  end if;

  v_lead_id := public.rm_upsert_person(p, 'contact');

  insert into public.contact_requests (lead_id, profile_type, company, role, link, message, language, utm, idempotency_key)
  values (
    v_lead_id, p->>'profile_type', nullif(p->>'company', ''), nullif(p->>'role', ''), nullif(p->>'link', ''),
    nullif(p->>'message', ''), coalesce(nullif(p->>'language', ''), 'it'), coalesce(p->'utm', '{}'::jsonb), v_key
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then -- concurrent duplicate
    select id into v_id from public.contact_requests where idempotency_key = v_key;
    return jsonb_build_object('request_id', v_id, 'duplicate', true);
  end if;
  return jsonb_build_object('request_id', v_id, 'duplicate', false);
end $$;
revoke all on function public.submit_contact(jsonb) from public, anon, authenticated;
grant execute on function public.submit_contact(jsonb) to service_role;

-- ─────────────────────────────────────────────────────────────
-- submit_join_application(p) → { application_id, duplicate }
-- The file is uploaded by the API route first; on duplicate the route deletes its new upload.
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_join_application(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key     uuid := (p->>'idempotency_key')::uuid;
  v_kind    text := p->>'kind';
  v_id      uuid;
  v_lead_id uuid;
begin
  select id into v_id from public.join_applications where idempotency_key = v_key;
  if v_id is not null then
    return jsonb_build_object('application_id', v_id, 'duplicate', true);
  end if;

  v_lead_id := public.rm_upsert_person(p, 'join');

  insert into public.join_applications (
    lead_id, kind, application, company, role, link, notes,
    pitch_storage_path, cv_storage_path, file_name, file_size, language, utm, idempotency_key
  ) values (
    v_lead_id, v_kind, p->'application', nullif(p->>'company', ''), nullif(p->>'role', ''),
    nullif(p->>'link', ''), nullif(p->>'notes', ''),
    case when v_kind = 'pitch' then nullif(p->>'storage_path', '') end,
    case when v_kind = 'cv' then nullif(p->>'storage_path', '') end,
    nullif(p->>'file_name', ''), nullif(p->>'file_size', '')::int,
    coalesce(nullif(p->>'language', ''), 'it'), coalesce(p->'utm', '{}'::jsonb), v_key
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.join_applications where idempotency_key = v_key;
    return jsonb_build_object('application_id', v_id, 'duplicate', true);
  end if;
  return jsonb_build_object('application_id', v_id, 'duplicate', false);
end $$;
revoke all on function public.submit_join_application(jsonb) from public, anon, authenticated;
grant execute on function public.submit_join_application(jsonb) to service_role;

-- ─────────────────────────────────────────────────────────────
-- submit_community_request(p) → { request_id, duplicate }
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_community_request(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug    text := p->>'community_slug';
  v_id      uuid;
  v_lead_id uuid;
begin
  v_lead_id := public.rm_upsert_person(p, 'community');

  insert into public.community_requests (lead_id, community_slug, language, utm)
  values (v_lead_id, v_slug, coalesce(nullif(p->>'language', ''), 'it'), coalesce(p->'utm', '{}'::jsonb))
  on conflict (lead_id, community_slug) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.community_requests where lead_id = v_lead_id and community_slug = v_slug;
    return jsonb_build_object('request_id', v_id, 'duplicate', true);
  end if;
  return jsonb_build_object('request_id', v_id, 'duplicate', false);
end $$;
revoke all on function public.submit_community_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_community_request(jsonb) to service_role;
