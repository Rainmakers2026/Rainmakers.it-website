-- Rainmakers.it — full schema for a NEW (empty) Supabase project: migrations 0001–0007 in order.
-- Generated from supabase/migrations/ (the source of truth) on 2026-10-13. Paste the whole file into
-- Supabase → SQL Editor → Run. One transaction: if any statement fails, nothing is applied.

begin;

-- ═════════════ 0001_init.sql ═════════════
-- Rainmakers.it — database schema (PRD v2 §17, §20)
-- Supabase is empty: this creates structure only. No data is inserted (PRD: never invent data).
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists citext;

-- Shared trigger for updated_at
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────
-- leads (MVP) — written only through submit_lead() from the server
-- ─────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  first_name           text not null check (char_length(first_name) between 1 and 80),
  last_name            text not null check (char_length(last_name) between 1 and 80),
  email                citext not null unique check (char_length(email) <= 254),
  company              text not null check (char_length(company) <= 120),
  role                 text not null check (char_length(role) <= 120),
  website_or_linkedin  text check (char_length(website_or_linkedin) <= 300),
  profile_type         text not null check (profile_type in
                         ('founder','startup','investor','corporate','innovation_professional','other')),
  interest             text check (char_length(interest) <= 1000),
  language             text not null default 'it' check (language in ('it','en')),
  consent              boolean not null check (consent = true),
  consent_version      text not null,
  consent_at           timestamptz not null default now(),
  utm                  jsonb not null default '{}'::jsonb,
  status               text not null default 'new' check (status in ('new','qualified','contacted','in_community','archived')),
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_profile_type_idx on public.leads (profile_type);
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

-- One row per submission: attribution history + per-email rate limiting.
create table if not exists public.lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  language    text not null,
  utm         jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists lead_events_lead_time_idx on public.lead_events (lead_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- communities (MVP) — the site lists rows with status active / full / coming_soon
-- ─────────────────────────────────────────────────────────────
create table if not exists public.communities (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_it         text not null,
  name_en         text not null,
  description_it  text,
  description_en  text,
  target          text,          -- e.g. 'founder', 'investor', 'all'
  category        text,          -- e.g. 'ecosystem', 'fintech', 'scaleup'
  whatsapp_url    text check (whatsapp_url is null or whatsapp_url ~ '^https://chat\.whatsapp\.com/'),
  status          text not null default 'coming_soon' check (status in ('active','full','coming_soon','archived')),
  capacity        integer check (capacity is null or capacity > 0),
  sort_order      integer not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at before update on public.communities
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Future tables (structure only, PRD §20, §49)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.content (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,                 -- e.g. 'hero.title'
  locale      text not null check (locale in ('it','en')),
  value       jsonb not null,
  status      text not null default 'draft' check (status in ('draft','to_verify','published')),
  updated_at  timestamptz not null default now(),
  unique (key, locale)
);

create table if not exists public.ecosystem_links (
  id          uuid primary key default gen_random_uuid(),
  label_it    text not null,
  label_en    text not null,
  url         text not null,
  category    text,
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null unique,
  language    text not null default 'it' check (language in ('it','en')),
  consent     boolean not null check (consent = true),
  consent_at  timestamptz not null default now(),
  status      text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Default: no access for anon/authenticated. One exception: public read of visible communities.
-- ─────────────────────────────────────────────────────────────
alter table public.leads                  enable row level security;
alter table public.lead_events            enable row level security;
alter table public.communities            enable row level security;
alter table public.content                enable row level security;
alter table public.ecosystem_links        enable row level security;
alter table public.newsletter_subscribers enable row level security;

revoke all on public.leads, public.lead_events, public.newsletter_subscribers from anon, authenticated;

grant select on public.communities to anon, authenticated;
drop policy if exists "Visible communities are public" on public.communities;
create policy "Visible communities are public" on public.communities
  for select to anon, authenticated
  using (status in ('active','full','coming_soon'));

-- Future public reads, ready to enable when content is published:
grant select on public.content, public.ecosystem_links to anon, authenticated;
drop policy if exists "Published content is public" on public.content;
create policy "Published content is public" on public.content for select to anon, authenticated using (status = 'published');
drop policy if exists "Published links are public" on public.ecosystem_links;
create policy "Published links are public" on public.ecosystem_links for select to anon, authenticated using (status = 'published');

-- ─────────────────────────────────────────────────────────────
-- submit_lead(p jsonb) → { lead_id }
-- Upsert by email + submission log + per-email rate limit (5/hour). Server-side only.
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_lead(p jsonb) returns jsonb
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
    first_name, last_name, email, company, role, website_or_linkedin,
    profile_type, interest, language, consent, consent_version, consent_at, utm
  ) values (
    p->>'first_name', p->>'last_name', p->>'email', p->>'company', p->>'role',
    nullif(p->>'website_or_linkedin', ''),
    p->>'profile_type', nullif(p->>'interest', ''), v_lang,
    true, p->>'consent_version', now(), coalesce(p->'utm', '{}'::jsonb)
  )
  on conflict (email) do update set
    first_name          = excluded.first_name,
    last_name           = excluded.last_name,
    company             = excluded.company,
    role                = excluded.role,
    website_or_linkedin = coalesce(excluded.website_or_linkedin, l.website_or_linkedin),
    profile_type        = excluded.profile_type,
    interest            = coalesce(excluded.interest, l.interest),
    language            = excluded.language,
    consent             = true,
    consent_version     = excluded.consent_version,
    consent_at          = now()
    -- utm keeps first-touch attribution; every touch is in lead_events
  returning id into v_lead_id;

  select count(*) into v_recent
  from public.lead_events
  where lead_id = v_lead_id and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.lead_events (lead_id, language, utm)
  values (v_lead_id, v_lang, coalesce(p->'utm', '{}'::jsonb));

  return jsonb_build_object('lead_id', v_lead_id);
end $$;

revoke all on function public.submit_lead(jsonb) from public, anon, authenticated;
grant execute on function public.submit_lead(jsonb) to service_role;

-- GDPR: erase a person on request (SQL editor)
-- delete from public.leads where email = 'person@example.com';  -- cascades to lead_events


-- ═════════════ 0002_lead_application.sql ═════════════
alter table public.leads
  add column if not exists application jsonb;

-- Keep the original submit_lead validation, per-email limit and event log while
-- storing the structured pitch application alongside the standard lead fields.
create or replace function public.submit_lead(p jsonb) returns jsonb
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
    first_name, last_name, email, company, role, website_or_linkedin,
    profile_type, interest, application, language, consent, consent_version, consent_at, utm
  ) values (
    p->>'first_name', p->>'last_name', p->>'email', p->>'company', p->>'role',
    nullif(p->>'website_or_linkedin', ''),
    p->>'profile_type', nullif(p->>'interest', ''), p->'application', v_lang,
    true, p->>'consent_version', now(), coalesce(p->'utm', '{}'::jsonb)
  )
  on conflict (email) do update set
    first_name          = excluded.first_name,
    last_name           = excluded.last_name,
    company             = excluded.company,
    role                = excluded.role,
    website_or_linkedin = coalesce(excluded.website_or_linkedin, l.website_or_linkedin),
    profile_type        = excluded.profile_type,
    interest            = coalesce(excluded.interest, l.interest),
    application         = coalesce(excluded.application, l.application),
    language            = excluded.language,
    consent             = true,
    consent_version     = excluded.consent_version,
    consent_at          = now()
  returning id into v_lead_id;

  select count(*) into v_recent
  from public.lead_events
  where lead_id = v_lead_id and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.lead_events (lead_id, language, utm)
  values (v_lead_id, v_lang, coalesce(p->'utm', '{}'::jsonb));

  return jsonb_build_object('lead_id', v_lead_id);
end $$;

revoke all on function public.submit_lead(jsonb) from public, anon, authenticated;
grant execute on function public.submit_lead(jsonb) to service_role;


-- ═════════════ 0003_form_submissions.sql ═════════════
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


-- ═════════════ 0004_storage_join_documents.sql ═════════════
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


-- ═════════════ 0005_newsletter_brevo.sql ═════════════
-- Rainmakers.it — 0005: newsletter double opt-in + Brevo sync + one-time welcome emails (PRD §11)
--
-- Additive and re-runnable. Requires 0001 and 0003. Rollback: supabase/rollback/0005_down.sql
--   • reuses newsletter_subscribers (0001): adds consent evidence, confirmation token (hash only),
--     Brevo sync status and welcome-email tracking — no new subscriber table
--   • join_applications (0003) gets welcome-email tracking for the "application received" email
--   • all logic runs in SECURITY DEFINER functions executable only by service_role (API routes)
--   • RLS stays as in 0001: anon/authenticated have no access to newsletter_subscribers

-- ─────────────────────────────────────────────────────────────
-- newsletter_subscribers: consent evidence, double opt-in, Brevo sync, welcome email
-- ─────────────────────────────────────────────────────────────
alter table public.newsletter_subscribers
  add column if not exists consent_version      text,
  add column if not exists source               text check (source is null or source in ('footer','final','news','popup')),
  add column if not exists confirm_token_hash   text,           -- sha256 of the emailed token; the token itself is never stored
  add column if not exists confirm_expires_at   timestamptz,
  add column if not exists confirmation_status  text not null default 'not_sent' check (confirmation_status in ('not_sent','sent','failed')),
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmed_at         timestamptz,    -- double opt-in completed (consent evidence)
  add column if not exists unsubscribed_at      timestamptz,
  add column if not exists brevo_sync_status    text not null default 'pending' check (brevo_sync_status in ('pending','synced','failed','skipped')),
  add column if not exists brevo_synced_at      timestamptz,
  add column if not exists brevo_attempts       integer not null default 0,
  add column if not exists brevo_last_error     text check (brevo_last_error is null or char_length(brevo_last_error) <= 200),
  add column if not exists welcome_sent_at      timestamptz,    -- claimed atomically: the welcome email is sent at most once
  add column if not exists welcome_attempts     integer not null default 0,
  add column if not exists updated_at           timestamptz not null default now();

create unique index if not exists newsletter_confirm_token_idx on public.newsletter_subscribers (confirm_token_hash) where confirm_token_hash is not null;

drop trigger if exists newsletter_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_set_updated_at before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

-- Rows written by the previous code were marked 'confirmed' without a confirmation email.
-- They are NOT sent to Brevo automatically: the team decides (consent evidence is weaker).
update public.newsletter_subscribers
set brevo_sync_status = 'skipped', welcome_sent_at = coalesce(welcome_sent_at, created_at)
where status = 'confirmed' and confirmed_at is null and brevo_sync_status = 'pending';

-- ─────────────────────────────────────────────────────────────
-- join_applications: "application received" email, sent at most once
-- ─────────────────────────────────────────────────────────────
alter table public.join_applications
  add column if not exists welcome_sent_at  timestamptz,
  add column if not exists welcome_attempts integer not null default 0;

-- ─────────────────────────────────────────────────────────────
-- newsletter_subscribe(p) → { id, action }
--   action: send_confirmation | already_subscribed | confirmation_recent
-- p: email, language, consent_version, source, token_hash, ttl_hours
-- ─────────────────────────────────────────────────────────────
create or replace function public.newsletter_subscribe(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.newsletter_subscribers;
  v_email   text := lower(trim(p->>'email'));
  v_lang    text := coalesce(nullif(p->>'language', ''), 'it');
  v_expires timestamptz := now() + make_interval(hours => coalesce((p->>'ttl_hours')::int, 48));
begin
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  select * into v_row from public.newsletter_subscribers where email = v_email for update;

  if not found then
    insert into public.newsletter_subscribers (
      email, language, consent, consent_at, consent_version, source, status,
      confirm_token_hash, confirm_expires_at, brevo_sync_status
    ) values (
      v_email, v_lang, true, now(), p->>'consent_version', nullif(p->>'source', ''), 'pending',
      p->>'token_hash', v_expires, 'pending'
    )
    on conflict (email) do nothing
    returning * into v_row;
    if v_row.id is null then -- concurrent insert: treat as a pending duplicate
      return jsonb_build_object('id', null, 'action', 'confirmation_recent');
    end if;
    return jsonb_build_object('id', v_row.id, 'action', 'send_confirmation');
  end if;

  if v_row.status = 'confirmed' then
    return jsonb_build_object('id', v_row.id, 'action', 'already_subscribed');
  end if;

  -- Pending with a confirmation email sent in the last 10 minutes: don't send another one
  if v_row.status = 'pending' and v_row.confirmation_status = 'sent'
     and v_row.confirmation_sent_at > now() - interval '10 minutes'
     and v_row.confirm_expires_at > now() then
    return jsonb_build_object('id', v_row.id, 'action', 'confirmation_recent');
  end if;

  -- New token for: older pending requests, failed sends, or re-subscription after unsubscribing
  update public.newsletter_subscribers set
    status              = 'pending',
    language            = v_lang,
    consent             = true,
    consent_at          = now(),
    consent_version     = p->>'consent_version',
    source              = coalesce(nullif(p->>'source', ''), source),
    confirm_token_hash  = p->>'token_hash',
    confirm_expires_at  = v_expires,
    confirmation_status = 'not_sent',
    unsubscribed_at     = null
  where id = v_row.id;
  return jsonb_build_object('id', v_row.id, 'action', 'send_confirmation');
end $$;

-- newsletter_record_confirmation(p_id, p_ok) — outcome of sending the confirmation email
create or replace function public.newsletter_record_confirmation(p_id uuid, p_ok boolean) returns void
language sql
security definer
set search_path = public
as $$
  update public.newsletter_subscribers
  set confirmation_status = case when p_ok then 'sent' else 'failed' end,
      confirmation_sent_at = case when p_ok then now() else confirmation_sent_at end
  where id = p_id;
$$;

-- newsletter_confirm(p_token_hash) → { id, action, email, language, needs_sync, needs_welcome }
--   action: confirmed | already_confirmed | expired | invalid
create or replace function public.newsletter_confirm(p_token_hash text) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.newsletter_subscribers;
begin
  select * into v_row from public.newsletter_subscribers where confirm_token_hash = p_token_hash for update;
  if not found then
    return jsonb_build_object('action', 'invalid');
  end if;

  if v_row.status = 'confirmed' then
    return jsonb_build_object(
      'id', v_row.id, 'action', 'already_confirmed', 'email', v_row.email, 'language', v_row.language,
      'needs_sync', v_row.brevo_sync_status in ('pending', 'failed'), 'needs_welcome', v_row.welcome_sent_at is null
    );
  end if;

  if v_row.status <> 'pending' or v_row.confirm_expires_at is null or v_row.confirm_expires_at < now() then
    return jsonb_build_object('action', 'expired');
  end if;

  update public.newsletter_subscribers
  set status = 'confirmed', confirmed_at = now(), brevo_sync_status = 'pending'
  where id = v_row.id;

  return jsonb_build_object(
    'id', v_row.id, 'action', 'confirmed', 'email', v_row.email, 'language', v_row.language,
    'needs_sync', true, 'needs_welcome', v_row.welcome_sent_at is null
  );
end $$;

-- newsletter_record_sync(p_id, p_ok, p_error) — outcome of adding the contact to the Brevo list
create or replace function public.newsletter_record_sync(p_id uuid, p_ok boolean, p_error text) returns void
language sql
security definer
set search_path = public
as $$
  update public.newsletter_subscribers
  set brevo_sync_status = case when p_ok then 'synced' else 'failed' end,
      brevo_synced_at   = case when p_ok then now() else brevo_synced_at end,
      brevo_attempts    = brevo_attempts + 1,
      brevo_last_error  = case when p_ok then null else left(p_error, 200) end
  where id = p_id and status = 'confirmed';
$$;

-- ─────────────────────────────────────────────────────────────
-- rm_claim_welcome(p_kind, p_id) → { email, language, first_name, kind } or {} if already claimed
-- One atomic UPDATE: concurrent requests or retries can never send the same welcome twice.
-- rm_release_welcome(p_kind, p_id) re-opens the claim after a failed send (retried by the cron).
-- ─────────────────────────────────────────────────────────────
create or replace function public.rm_claim_welcome(p_kind text, p_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if p_kind = 'newsletter' then
    update public.newsletter_subscribers
    set welcome_sent_at = now(), welcome_attempts = welcome_attempts + 1
    where id = p_id and welcome_sent_at is null and status = 'confirmed'
    returning jsonb_build_object('email', email, 'language', language) into v;
  elsif p_kind = 'join' then
    update public.join_applications j
    set welcome_sent_at = now(), welcome_attempts = j.welcome_attempts + 1
    from public.leads l
    where j.id = p_id and j.welcome_sent_at is null and l.id = j.lead_id
    returning jsonb_build_object('email', l.email, 'language', j.language, 'first_name', l.first_name, 'kind', j.kind) into v;
  else
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  return coalesce(v, '{}'::jsonb);
end $$;

create or replace function public.rm_release_welcome(p_kind text, p_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'newsletter' then
    update public.newsletter_subscribers set welcome_sent_at = null where id = p_id;
  elsif p_kind = 'join' then
    update public.join_applications set welcome_sent_at = null where id = p_id;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- rm_brevo_pending_work() — what the daily retry job should redo (max 5 attempts each)
--   • confirmed subscribers not yet in the Brevo list, or without a welcome email
--   • join applications whose "received" email failed in the last 2 days
-- ─────────────────────────────────────────────────────────────
create or replace function public.rm_brevo_pending_work() returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'newsletter', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'email', email, 'language', language,
        'needs_sync', brevo_sync_status in ('pending','failed') and brevo_attempts < 5,
        'needs_welcome', welcome_sent_at is null and welcome_attempts < 5))
      from (
        select * from public.newsletter_subscribers
        where status = 'confirmed'
          and ((brevo_sync_status in ('pending','failed') and brevo_attempts < 5) or (welcome_sent_at is null and welcome_attempts < 5))
        order by confirmed_at nulls last
        limit 50
      ) s), '[]'::jsonb),
    'join', coalesce((
      select jsonb_agg(id) from (
        select id from public.join_applications
        where welcome_sent_at is null and welcome_attempts between 1 and 4 and created_at > now() - interval '2 days'
        limit 50
      ) j), '[]'::jsonb)
  );
$$;

-- Only the server (service_role) may run these
revoke all on function public.newsletter_subscribe(jsonb) from public, anon, authenticated;
revoke all on function public.newsletter_record_confirmation(uuid, boolean) from public, anon, authenticated;
revoke all on function public.newsletter_confirm(text) from public, anon, authenticated;
revoke all on function public.newsletter_record_sync(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.rm_claim_welcome(text, uuid) from public, anon, authenticated;
revoke all on function public.rm_release_welcome(text, uuid) from public, anon, authenticated;
revoke all on function public.rm_brevo_pending_work() from public, anon, authenticated;
grant execute on function public.newsletter_subscribe(jsonb) to service_role;
grant execute on function public.newsletter_record_confirmation(uuid, boolean) to service_role;
grant execute on function public.newsletter_confirm(text) to service_role;
grant execute on function public.newsletter_record_sync(uuid, boolean, text) to service_role;
grant execute on function public.rm_claim_welcome(text, uuid) to service_role;
grant execute on function public.rm_release_welcome(text, uuid) to service_role;
grant execute on function public.rm_brevo_pending_work() to service_role;

-- RLS on newsletter_subscribers is unchanged from 0001 (enabled, revoked from anon/authenticated).


-- ═════════════ 0006_site_annotations.sql ═════════════
-- Rainmakers.it — 0006: internal annotations on the website (PRD §14)
--
-- Re-runnable. Rollback: supabase/rollback/0006_down.sql. Policy tests: supabase/tests/0006_annotations_rls.sql
--
-- Access model (enforced HERE, by RLS — the API routes call PostgREST with the signed-in user's JWT,
-- never with the service key):
--   • anon                       → nothing
--   • authenticated, not in team → nothing (cannot even see that annotations exist)
--   • team member, role editor   → read all; create (as themselves); edit text/anchor of OWN annotations;
--                                  change status (open/resolved/archived) of any annotation; no delete
--   • team member, role admin    → all of the above + edit any annotation + delete
-- Team membership is managed only by admins from the Supabase dashboard / SQL editor (service role):
-- nobody can add themselves. Users are invited in Auth (sign-ups disabled), then listed in team_members.

-- ─────────────────────────────────────────────────────────────
-- team_members — allowlist of people who may use the annotation tool
-- ─────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       citext not null,
  role        text not null default 'editor' check (role in ('editor', 'admin')),
  created_at  timestamptz not null default now()
);
alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;
grant select on public.team_members to authenticated;

-- A signed-in user may read only their own membership row (to know their role)
drop policy if exists "Team members read own row" on public.team_members;
create policy "Team members read own row" on public.team_members
  for select to authenticated
  using (user_id = auth.uid());

-- Helpers used by the policies (SECURITY DEFINER so they can read team_members regardless of RLS)
create or replace function public.rm_is_team_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where user_id = auth.uid());
$$;
create or replace function public.rm_is_team_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function public.rm_is_team_member() from public, anon;
revoke all on function public.rm_is_team_admin() from public, anon;
grant execute on function public.rm_is_team_member() to authenticated;
grant execute on function public.rm_is_team_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- site_annotations
-- Anchoring: page_path + section_id (stable ids such as "founder", "rainforest", "connect") +
-- optional element_selector inside that section + anchor_data { x, y } normalised to 0–1 within the
-- anchored element, so pins follow the content across viewport sizes and layout changes.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.site_annotations (
  id                uuid primary key default gen_random_uuid(),
  page_path         text not null check (page_path ~ '^/(it|en)(/[a-z0-9/_-]*)?$' and char_length(page_path) <= 200),
  locale            text not null check (locale in ('it', 'en')),
  section_id        text check (section_id is null or (section_id ~ '^[A-Za-z][A-Za-z0-9_-]*$' and char_length(section_id) <= 80)),
  element_selector  text check (element_selector is null or char_length(element_selector) <= 300),
  anchor_data       jsonb not null default '{}'::jsonb,
  comment           text not null check (char_length(btrim(comment)) between 1 and 2000),
  status            text not null default 'open' check (status in ('open', 'resolved', 'archived')),
  author_id         uuid default auth.uid() references auth.users(id) on delete set null,  -- set by trigger; NULL once the account is deleted
  author_email      text,
  resolved_by       uuid references auth.users(id) on delete set null,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists site_annotations_page_idx on public.site_annotations (page_path, status, created_at desc);

-- Server-side integrity: author fields come from the JWT, never from the client; immutable afterwards.
-- Editors may change only the status of others' annotations; text/anchor edits are author- or admin-only.
create or replace function public.rm_site_annotations_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.author_id    := auth.uid();
    new.author_email := coalesce(auth.jwt() ->> 'email', new.author_email);
    new.status       := 'open';
    new.resolved_by  := null;
    new.resolved_at  := null;
    new.created_at   := now();
    new.updated_at   := now();
    return new;
  end if;

  -- UPDATE
  new.id           := old.id;
  new.author_id    := old.author_id;
  new.author_email := old.author_email;
  new.created_at   := old.created_at;
  new.page_path    := old.page_path;
  new.locale       := old.locale;
  if (new.comment is distinct from old.comment
      or new.section_id is distinct from old.section_id
      or new.element_selector is distinct from old.element_selector
      or new.anchor_data is distinct from old.anchor_data)
     and old.author_id is distinct from auth.uid()
     and not public.rm_is_team_admin() then
    raise exception 'only_author_can_edit' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    new.resolved_by := case when new.status = 'open' then null else auth.uid() end;
    new.resolved_at := case when new.status = 'open' then null else now() end;
  else
    new.resolved_by := old.resolved_by;
    new.resolved_at := old.resolved_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists site_annotations_guard on public.site_annotations;
create trigger site_annotations_guard before insert or update on public.site_annotations
for each row execute function public.rm_site_annotations_guard();

alter table public.site_annotations enable row level security;
revoke all on public.site_annotations from anon, authenticated;
grant select, insert, update, delete on public.site_annotations to authenticated;

drop policy if exists "Team reads annotations" on public.site_annotations;
create policy "Team reads annotations" on public.site_annotations
  for select to authenticated
  using (public.rm_is_team_member());

drop policy if exists "Team creates own annotations" on public.site_annotations;
create policy "Team creates own annotations" on public.site_annotations
  for insert to authenticated
  with check (public.rm_is_team_member() and author_id = auth.uid());

drop policy if exists "Team updates annotations" on public.site_annotations;
create policy "Team updates annotations" on public.site_annotations
  for update to authenticated
  using (public.rm_is_team_member())
  with check (public.rm_is_team_member());

drop policy if exists "Admins delete annotations" on public.site_annotations;
create policy "Admins delete annotations" on public.site_annotations
  for delete to authenticated
  using (public.rm_is_team_admin());


-- ═════════════ 0007_reviews.sql ═════════════
-- Rainmakers.it — 0007: reviews left from the "Lascia una review" popup ("Dicono di noi")
--
-- Additive and re-runnable. Requires 0003 (rm_upsert_person, lead_events.kind).
--   • one row per review; the person is upserted in leads like the other forms (privacy consent required)
--   • publish_consent records whether the author allows publication on the website (name + company)
--   • status is managed by the team: new → approved/published or rejected. Nothing is published automatically
--   • RLS on, no access for anon/authenticated; writes only through SECURITY DEFINER functions granted to
--     service_role (called by /api/review, never from the browser)
-- Rollback: supabase/rollback/0007_down.sql

-- lead_events.kind gains 'review'
alter table public.lead_events drop constraint if exists lead_events_kind_check;
alter table public.lead_events add constraint lead_events_kind_check
  check (kind is null or kind in ('contact', 'join', 'community', 'review'));

create table if not exists public.reviews (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  company          text check (char_length(company) <= 120),
  role             text check (char_length(role) <= 120),
  rating           smallint check (rating between 1 and 5),
  body             text not null check (char_length(body) between 20 and 1500),
  publish_consent  boolean not null default false,
  language         text not null check (language in ('it','en')),
  utm              jsonb not null default '{}'::jsonb,
  idempotency_key  uuid not null unique,
  status           text not null default 'new' check (status in ('new','approved','published','rejected')),
  notified_at      timestamptz,             -- set when the email to info@rainmakers.it was sent
  created_at       timestamptz not null default now()
);
create index if not exists reviews_created_idx on public.reviews (created_at desc);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- submit_review(p) → { review_id, duplicate }
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_review(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key     uuid := (p->>'idempotency_key')::uuid;
  v_id      uuid;
  v_lead_id uuid;
begin
  select id into v_id from public.reviews where idempotency_key = v_key;
  if v_id is not null then
    return jsonb_build_object('review_id', v_id, 'duplicate', true);
  end if;

  v_lead_id := public.rm_upsert_person(p, 'review');

  insert into public.reviews (lead_id, company, role, rating, body, publish_consent, language, utm, idempotency_key)
  values (
    v_lead_id, nullif(p->>'company', ''), nullif(p->>'role', ''), nullif(p->>'rating', '')::smallint,
    p->>'body', coalesce((p->>'publish_consent')::boolean, false),
    coalesce(nullif(p->>'language', ''), 'it'), coalesce(p->'utm', '{}'::jsonb), v_key
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then -- concurrent duplicate
    select id into v_id from public.reviews where idempotency_key = v_key;
    return jsonb_build_object('review_id', v_id, 'duplicate', true);
  end if;
  return jsonb_build_object('review_id', v_id, 'duplicate', false);
end $$;
revoke all on function public.submit_review(jsonb) from public, anon, authenticated;
grant execute on function public.submit_review(jsonb) to service_role;

-- review_mark_notified(id): records that the team email was sent
create or replace function public.review_mark_notified(p_id uuid) returns void
language sql
security definer
set search_path = public
as $$
  update public.reviews set notified_at = now() where id = p_id and notified_at is null;
$$;
revoke all on function public.review_mark_notified(uuid) from public, anon, authenticated;
grant execute on function public.review_mark_notified(uuid) to service_role;


commit;

-- Check: should list 12 tables, all with rls_enabled = true
select c.relname as table_name, c.relrowsecurity as rls_enabled from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1;
