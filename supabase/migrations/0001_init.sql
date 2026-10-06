-- Rainmakers.it — lead database (PRD §36)
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists citext;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  first_name       text not null check (char_length(first_name) between 1 and 80),
  last_name        text not null check (char_length(last_name) between 1 and 80),
  email            citext not null unique check (char_length(email) <= 254),
  company          text not null check (char_length(company) <= 120),
  role             text not null check (char_length(role) <= 120),
  website          text check (char_length(website) <= 300),
  linkedin         text check (char_length(linkedin) <= 300),
  company_stage    text not null check (company_stage in
                     ('idea','pre-seed','seed','early-stage','growth','scaleup','established','other')),
  main_challenge   text[] not null default '{}',
  interests        text[] not null default '{}',
  source           text,
  -- extra fields (see docs/02-prd-review.md §C)
  last_intent      text not null default 'join' check (last_intent in ('join','community','contact')),
  locale           text not null default 'it' check (locale in ('it','en')),
  utm              jsonb not null default '{}'::jsonb,
  -- GDPR (PRD §55)
  consent          boolean not null check (consent = true),
  consent_version  text not null,
  consent_at       timestamptz not null default now(),
  -- CRM-lite
  status           text not null default 'new' check (status in ('new','qualified','contacted','member','archived')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.community_requests (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  community   text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected','invited')),
  created_at  timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  message     text not null check (char_length(message) <= 2000),
  status      text not null default 'open' check (status in ('open','answered','closed')),
  created_at  timestamptz not null default now()
);

-- One row per form submission: attribution history + per-email rate limiting.
create table if not exists public.lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  intent      text not null,
  locale      text not null,
  utm         jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists community_requests_lead_idx on public.community_requests (lead_id);
create index if not exists community_requests_status_idx on public.community_requests (status);
create index if not exists contact_requests_lead_idx on public.contact_requests (lead_id);
create index if not exists lead_events_lead_time_idx on public.lead_events (lead_id, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: no public access at all.
-- The website writes only through submit_lead() with the service-role key (server-side).
-- Team members read data from the Supabase dashboard (or add policies for an admin role later).
-- ─────────────────────────────────────────────────────────────
alter table public.leads              enable row level security;
alter table public.community_requests enable row level security;
alter table public.contact_requests   enable row level security;
alter table public.lead_events        enable row level security;

revoke all on public.leads, public.community_requests, public.contact_requests, public.lead_events
  from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- submit_lead(p jsonb) → { lead_id }
-- Atomic upsert + request creation + per-email rate limit (5 submissions/hour).
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_lead(p jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_intent  text := coalesce(p->>'intent', 'join');
  v_recent  int;
begin
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  insert into public.leads as l (
    first_name, last_name, email, company, role, website, linkedin,
    company_stage, main_challenge, interests, source,
    last_intent, locale, utm, consent, consent_version, consent_at
  ) values (
    p->>'first_name', p->>'last_name', p->>'email', p->>'company', p->>'role',
    nullif(p->>'website', ''), nullif(p->>'linkedin', ''),
    p->>'company_stage',
    coalesce(array(select jsonb_array_elements_text(p->'main_challenge')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'interests')), '{}'),
    nullif(p->>'source', ''),
    v_intent, coalesce(p->>'locale', 'it'), coalesce(p->'utm', '{}'::jsonb),
    true, p->>'consent_version', now()
  )
  on conflict (email) do update set
    first_name      = excluded.first_name,
    last_name       = excluded.last_name,
    company         = excluded.company,
    role            = excluded.role,
    website         = coalesce(excluded.website, l.website),
    linkedin        = coalesce(excluded.linkedin, l.linkedin),
    company_stage   = excluded.company_stage,
    main_challenge  = case when cardinality(excluded.main_challenge) > 0 then excluded.main_challenge else l.main_challenge end,
    interests       = case when cardinality(excluded.interests) > 0 then excluded.interests else l.interests end,
    source          = coalesce(l.source, excluded.source),      -- keep first-touch source
    last_intent     = excluded.last_intent,
    locale          = excluded.locale,
    consent         = true,
    consent_version = excluded.consent_version,
    consent_at      = now()
  returning id into v_lead_id;

  select count(*) into v_recent
  from public.lead_events
  where lead_id = v_lead_id and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.lead_events (lead_id, intent, locale, utm)
  values (v_lead_id, v_intent, coalesce(p->>'locale', 'it'), coalesce(p->'utm', '{}'::jsonb));

  if v_intent = 'community' then
    insert into public.community_requests (lead_id, community)
    values (v_lead_id, coalesce(nullif(p->>'community', ''), 'rainmakers-founders'));
  elsif v_intent = 'contact' and coalesce(p->>'message', '') <> '' then
    insert into public.contact_requests (lead_id, message)
    values (v_lead_id, p->>'message');
  end if;

  return jsonb_build_object('lead_id', v_lead_id);
end $$;

revoke all on function public.submit_lead(jsonb) from public, anon, authenticated;
grant execute on function public.submit_lead(jsonb) to service_role;

-- ─────────────────────────────────────────────────────────────
-- Handy views for the team (dashboard only; RLS-protected through base tables)
-- ─────────────────────────────────────────────────────────────
create or replace view public.v_pending_community_requests
with (security_invoker = true) as
select cr.id, cr.created_at, cr.community, l.first_name, l.last_name, l.email, l.company,
       l.role, l.company_stage, l.main_challenge, l.linkedin
from public.community_requests cr
join public.leads l on l.id = cr.lead_id
where cr.status = 'pending'
order by cr.created_at;

revoke all on public.v_pending_community_requests from anon, authenticated;

-- GDPR helper: erase a person on request (run from the SQL editor)
-- delete from public.leads where email = 'person@example.com';  -- cascades to requests/events
