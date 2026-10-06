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
