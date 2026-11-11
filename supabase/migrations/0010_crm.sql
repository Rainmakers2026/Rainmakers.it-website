-- Rainmakers.it — 0010: one CRM for every form ("Rainmakers OS", 2026-11-11)
--
-- Additive and re-runnable: nothing is dropped or rewritten. The tables of 0001–0009 (leads, join_applications,
-- reviews, newsletter_subscribers…) stay as they are, read-only for the site from now on; scripts in
-- supabase/backfill/ can copy their rows here on a TEST project first.
--
-- Model
--   contacts                  one row per person, email normalised (citext, unique); first source kept forever
--   organizations             one row per organisation, deduplicated by website domain, else by normalised name
--   contact_organizations     many-to-many; one primary (active) organisation per contact, with the player type the
--                             contact declared for it — the latest declaration wins, the history stays in the submissions
--   organization_player_types every player type ever declared for an organisation (unique pair)
--   form_submissions          one row per request, with its own source, UTM, privacy version and form data
--   contact_interests         contact × area (giveback / open_venture_building / advisory), unique; `editorial` is true
--                             only when the person chose it for the newsletter (projected to Brevo); set, never cleared,
--                             without a new explicit choice
--   newsletter_subscriptions  contact × newsletter (only 'gocce_di_innovazione'), double opt-in state
--   consent_events            append-only consent log (purpose, action, privacy version, source, evidence ids only)
--   external_sync_status      what still has to reach Brevo / Airtable (nothing is sent until the sync is enabled)
--
-- Security
--   • RLS on every table and no policy: anon and authenticated read and write nothing.
--   • All writes go through SECURITY DEFINER functions executable only by service_role (the API routes).
--   • Idempotent: the same idempotency key never creates a second submission; the same email never a second contact.
--
-- Values below are checked here and in lib/crm/taxonomy.ts (scripts/test-crm.ts compares the two lists).
-- Rollback: supabase/rollback/0010_down.sql

create extension if not exists citext;

-- ─────────────────────────────────────────────────────────────
-- Vocabulary
-- ─────────────────────────────────────────────────────────────
create or replace function public.crm_areas() returns text[] language sql immutable as $$
  select array['giveback','open_venture_building','advisory']
$$;
create or replace function public.crm_player_types() returns text[] language sql immutable as $$
  select array['startup','venture_builder','vc','cvc','crowdfunding_platform','family_office','incubator_accelerator',
               'institution','media','empowerment_program','training_provider','association','pst','ban_club_deal','coworking']
$$;
create or replace function public.crm_industries() returns text[] language sql immutable as $$
  select array['agrifood','fashion_design','nanotech','robotics','mechanics','tourism','industry_5_0','cloud','mobile_apps',
               'b2b_services','hardware','fintech','iot','renewable_energy','energy_efficiency','sustainable_mobility',
               'waste_management','biotech','pharma','medical_devices','digital_health','assistive_tech','social_impact',
               'financial_services','education_research','public_sector','media_communication','other']
$$;
create or replace function public.crm_form_types() returns text[] language sql immutable as $$
  select array['company_request','startup_application','investor_application','giveback_application','job_application',
               'newsletter_signup','review']
$$;

-- ─────────────────────────────────────────────────────────────
-- contacts
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  email              citext not null unique check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  first_name         text check (char_length(first_name) <= 80),
  last_name          text check (char_length(last_name) <= 80),
  phone              text check (char_length(phone) <= 40),
  job_title          text check (char_length(job_title) <= 120),
  language           text not null default 'it' check (language in ('it','en')),
  -- first source, never overwritten
  first_form_id      text not null check (char_length(first_form_id) <= 60),
  first_source_page  text check (char_length(first_source_page) <= 300),
  first_source_brand text not null default 'rainmakers' check (char_length(first_source_brand) <= 40),
  first_utm          jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists contacts_created_idx on public.contacts (created_at desc);
drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 150),
  name_normalized  text not null check (char_length(name_normalized) between 1 and 150),
  website          text check (char_length(website) <= 300),
  domain           text check (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  industry         text check (industry is null or industry = any (public.crm_industries())),
  country          text check (country is null or country ~ '^[A-Z]{2}$'),
  city             text check (char_length(city) <= 120),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists organizations_domain_key on public.organizations (domain) where domain is not null;
create index if not exists organizations_name_idx on public.organizations (name_normalized);
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- contact_organizations (many-to-many, one primary per contact)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contact_organizations (
  contact_id       uuid not null references public.contacts(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  role             text check (char_length(role) <= 120),
  player_type      text check (player_type is null or player_type = any (public.crm_player_types())),
  is_primary       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (contact_id, organization_id)
);
create unique index if not exists contact_organizations_one_primary on public.contact_organizations (contact_id) where is_primary;
create index if not exists contact_organizations_org_idx on public.contact_organizations (organization_id);
drop trigger if exists contact_organizations_updated_at on public.contact_organizations;
create trigger contact_organizations_updated_at before update on public.contact_organizations for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- organization_player_types
-- ─────────────────────────────────────────────────────────────
create table if not exists public.organization_player_types (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  player_type      text not null check (player_type = any (public.crm_player_types())),
  created_at       timestamptz not null default now(),
  primary key (organization_id, player_type)
);

-- ─────────────────────────────────────────────────────────────
-- form_submissions
-- ─────────────────────────────────────────────────────────────
create table if not exists public.form_submissions (
  id                   uuid primary key default gen_random_uuid(),
  contact_id           uuid not null references public.contacts(id) on delete cascade,
  organization_id      uuid references public.organizations(id) on delete set null,
  form_id              text not null check (char_length(form_id) <= 60),
  form_type            text not null check (form_type = any (public.crm_form_types())),
  area                 text check (area is null or area = any (public.crm_areas())),
  player_type          text check (player_type is null or player_type = any (public.crm_player_types())),
  message              text check (char_length(message) <= 2000),
  data                 jsonb not null default '{}'::jsonb,          -- form-specific answers (stable codes)
  document_path        text check (document_path ~ '^(pitch|cv)/[0-9]{4}/[0-9]{2}/[0-9a-f-]{36}\.pdf$'),
  document_name        text check (char_length(document_name) <= 120),
  document_size        integer check (document_size is null or document_size between 1 and 4194304),
  document_link        text check (char_length(document_link) <= 300),
  language             text not null default 'it' check (language in ('it','en')),
  source_brand         text not null default 'rainmakers' check (char_length(source_brand) <= 40),
  source_page          text check (char_length(source_page) <= 300),
  utm_source           text check (char_length(utm_source) <= 200),
  utm_medium           text check (char_length(utm_medium) <= 200),
  utm_campaign         text check (char_length(utm_campaign) <= 200),
  utm_content          text check (char_length(utm_content) <= 200),
  utm_term             text check (char_length(utm_term) <= 200),
  privacy_version      text not null check (char_length(privacy_version) <= 40),
  newsletter_opt_in    boolean not null default false,
  editorial_interests  text[] not null default '{}' check (editorial_interests <@ public.crm_areas()),
  idempotency_key      uuid not null unique,
  status               text not null default 'new' check (status in ('new','in_progress','follow_up','closed','archived')),
  -- acknowledgement email to the visitor, sent at most once (claimed atomically, released on failure)
  ack_claimed_at       timestamptz,
  ack_sent_at          timestamptz,
  ack_attempts         smallint not null default 0,
  submitted_at         timestamptz not null default now()
);
create index if not exists form_submissions_contact_idx on public.form_submissions (contact_id, submitted_at desc);
create index if not exists form_submissions_org_idx on public.form_submissions (organization_id) where organization_id is not null;
create index if not exists form_submissions_area_idx on public.form_submissions (area, submitted_at desc);
create index if not exists form_submissions_status_idx on public.form_submissions (status, submitted_at desc);

-- ─────────────────────────────────────────────────────────────
-- contact_interests
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contact_interests (
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  area          text not null check (area = any (public.crm_areas())),
  first_origin  text not null check (char_length(first_origin) <= 80),   -- e.g. 'form:rm_startup_v1', 'newsletter:rm_newsletter_gdi_v1'
  last_origin   text not null check (char_length(last_origin) <= 80),
  editorial     boolean not null default false,                        -- chosen for "Gocce di Innovazione"
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (contact_id, area)
);
drop trigger if exists contact_interests_updated_at on public.contact_interests;
create trigger contact_interests_updated_at before update on public.contact_interests for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- newsletter_subscriptions
-- ─────────────────────────────────────────────────────────────
create table if not exists public.newsletter_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  contact_id             uuid not null references public.contacts(id) on delete cascade,
  newsletter_code        text not null default 'gocce_di_innovazione' check (newsletter_code = 'gocce_di_innovazione'),
  status                 text not null default 'pending_confirmation' check (status in ('pending_confirmation','subscribed','unsubscribed')),
  language               text not null default 'it' check (language in ('it','en')),
  consent_source         text not null check (char_length(consent_source) <= 80),   -- form id where the request was made
  consent_version        text not null check (char_length(consent_version) <= 40),
  subscribed_at          timestamptz,     -- last request
  confirmed_at           timestamptz,
  unsubscribed_at        timestamptz,
  -- double opt-in: only the SHA-256 of the confirmation token is stored
  confirm_token_hash     text unique check (confirm_token_hash ~ '^[0-9a-f]{64}$'),
  confirm_expires_at     timestamptz,
  confirmation_sent_at   timestamptz,
  confirmation_attempts  smallint not null default 0,
  welcome_claimed_at     timestamptz,
  welcome_sent_at        timestamptz,
  welcome_attempts       smallint not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (contact_id, newsletter_code)
);
create index if not exists newsletter_subscriptions_status_idx on public.newsletter_subscriptions (status);
drop trigger if exists newsletter_subscriptions_updated_at on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_updated_at before update on public.newsletter_subscriptions for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- consent_events (append-only)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.consent_events (
  id               uuid primary key default gen_random_uuid(),
  contact_id       uuid not null references public.contacts(id) on delete cascade,
  purpose          text not null check (purpose in ('request_processing','newsletter')),
  action           text not null check (action in ('granted','requested','confirmed','withdrawn')),
  privacy_version  text not null check (char_length(privacy_version) <= 40),
  source           text not null check (char_length(source) <= 80),       -- form id, 'email_link', 'brevo'…
  -- evidence: ids only (submission / subscription), never the personal data again
  evidence         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists consent_events_contact_idx on public.consent_events (contact_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- external_sync_status
-- ─────────────────────────────────────────────────────────────
create table if not exists public.external_sync_status (
  id              uuid primary key default gen_random_uuid(),
  record_type     text not null check (record_type in ('contact','organization','contact_organization','form_submission','newsletter_subscription')),
  record_id       uuid not null,
  destination     text not null check (destination in ('brevo','airtable')),
  external_id     text check (char_length(external_id) <= 120),
  sync_status     text not null default 'pending' check (sync_status in ('pending','synced','failed','skipped')),
  attempts        smallint not null default 0,
  last_synced_at  timestamptz,
  last_error      text check (char_length(last_error) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (record_type, record_id, destination)
);
create index if not exists external_sync_pending_idx on public.external_sync_status (destination, sync_status) where sync_status in ('pending','failed');
drop trigger if exists external_sync_status_updated_at on public.external_sync_status;
create trigger external_sync_status_updated_at before update on public.external_sync_status for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS: on, no policies → no access for anon / authenticated
-- ─────────────────────────────────────────────────────────────
alter table public.contacts                  enable row level security;
alter table public.organizations             enable row level security;
alter table public.contact_organizations     enable row level security;
alter table public.organization_player_types enable row level security;
alter table public.form_submissions          enable row level security;
alter table public.contact_interests         enable row level security;
alter table public.newsletter_subscriptions  enable row level security;
alter table public.consent_events            enable row level security;
alter table public.external_sync_status      enable row level security;
revoke all on public.contacts, public.organizations, public.contact_organizations, public.organization_player_types,
  public.form_submissions, public.contact_interests, public.newsletter_subscriptions, public.consent_events,
  public.external_sync_status from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
-- Marks a record as waiting for a destination (re-queues a synced one after a change)
create or replace function public.crm_queue_sync(p_type text, p_id uuid, p_destination text) returns void
language sql security definer set search_path = public as $$
  insert into public.external_sync_status (record_type, record_id, destination)
  values (p_type, p_id, p_destination)
  on conflict (record_type, record_id, destination)
  do update set sync_status = 'pending', attempts = 0, last_error = null
$$;

-- "Acme S.r.l." → "acme"; used to match organisations without a website
create or replace function public.crm_normalize_org_name(p text) returns text
language sql immutable as $$
  select nullif(trim(regexp_replace(regexp_replace(lower(coalesce(p, '')),
    '\m(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?|ltd|llc|inc|gmbh|srl|spa)\M', '', 'g'),
    '[^a-z0-9]+', ' ', 'g')), '')
$$;

-- "https://www.Acme.it/about" → "acme.it"
create or replace function public.crm_domain(p text) returns text
language sql immutable as $$
  select nullif(regexp_replace(lower(substring(coalesce(p, '') from '^(?:[a-z]+://)?([^/:?#]+)')), '^www\.', ''), '')
$$;

-- Upserts the contact by email; fills names, phone and role when given, never blanks them; first source on insert only
create or replace function public.crm_upsert_contact(p jsonb, p_form_id text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.contacts as c (email, first_name, last_name, phone, job_title, language,
                                    first_form_id, first_source_page, first_source_brand, first_utm)
  values (
    lower(trim(p->>'email')),
    nullif(trim(p->>'first_name'), ''),
    nullif(trim(p->>'last_name'), ''),
    nullif(trim(p->>'phone'), ''),
    nullif(trim(p->>'job_title'), ''),
    coalesce(nullif(p->>'language', ''), 'it'),
    p_form_id,
    nullif(p->>'source_page', ''),
    coalesce(nullif(p->>'source_brand', ''), 'rainmakers'),
    coalesce(p->'utm', '{}'::jsonb)
  )
  on conflict (email) do update set
    first_name = coalesce(excluded.first_name, c.first_name),
    last_name  = coalesce(excluded.last_name, c.last_name),
    phone      = coalesce(excluded.phone, c.phone),
    job_title  = coalesce(excluded.job_title, c.job_title),
    language   = excluded.language
  returning c.id into v_id;
  return v_id;
end $$;

-- Adds or refreshes an interest; `editorial` only ever goes from false to true here
create or replace function public.crm_add_interest(p_contact uuid, p_area text, p_origin text, p_editorial boolean) returns void
language sql security definer set search_path = public as $$
  insert into public.contact_interests as i (contact_id, area, first_origin, last_origin, editorial)
  values (p_contact, p_area, p_origin, p_origin, p_editorial)
  on conflict (contact_id, area) do update set
    last_origin = excluded.last_origin,
    editorial   = i.editorial or excluded.editorial
$$;

-- Newsletter request for a contact (double opt-in). Returns { id, action }:
--   send_confirmation    store the new token hash and send the email
--   confirmation_recent  a confirmation was sent less than 10 minutes ago: nothing sent
--   already_subscribed   confirmed subscriber: nothing sent (new interests are still recorded by the caller)
create or replace function public.crm_newsletter_request(p_contact uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.newsletter_subscriptions;
begin
  select * into s from public.newsletter_subscriptions
  where contact_id = p_contact and newsletter_code = 'gocce_di_innovazione' for update;

  if found and s.status = 'subscribed' then
    return jsonb_build_object('id', s.id, 'action', 'already_subscribed');
  end if;
  if found and s.status = 'pending_confirmation' and s.confirmation_sent_at > now() - interval '10 minutes' then
    return jsonb_build_object('id', s.id, 'action', 'confirmation_recent');
  end if;
  if (p->>'token_hash') !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token' using errcode = '22023';
  end if;

  insert into public.newsletter_subscriptions as n (contact_id, status, language, consent_source, consent_version,
                                                    subscribed_at, confirm_token_hash, confirm_expires_at)
  values (p_contact, 'pending_confirmation', coalesce(nullif(p->>'language', ''), 'it'), p->>'consent_source',
          p->>'consent_version', now(), p->>'token_hash',
          now() + make_interval(hours => least(greatest(coalesce((p->>'ttl_hours')::int, 48), 1), 168)))
  on conflict (contact_id, newsletter_code) do update set
    status             = 'pending_confirmation',
    language           = excluded.language,
    consent_source     = excluded.consent_source,
    consent_version    = excluded.consent_version,
    subscribed_at      = now(),
    unsubscribed_at    = null,
    confirm_token_hash = excluded.confirm_token_hash,
    confirm_expires_at = excluded.confirm_expires_at
  returning n.* into s;

  insert into public.consent_events (contact_id, purpose, action, privacy_version, source, evidence)
  values (p_contact, 'newsletter', 'requested', p->>'consent_version', p->>'consent_source',
          jsonb_build_object('subscription_id', s.id) || coalesce(p->'evidence', '{}'::jsonb));

  return jsonb_build_object('id', s.id, 'action', 'send_confirmation');
end $$;

-- ─────────────────────────────────────────────────────────────
-- crm_submit: one request from a player form, the job application or a review, in one transaction
--
-- p = { idempotency_key, form_id, form_type, area, language, source_brand, source_page, utm{…}, privacy_version,
--       contact{ email, first_name, last_name, phone, job_title },
--       organization{ name, website, industry, country, city } | null, player_type,
--       message, data{…}, document{ path, name, size, link } | null,
--       newsletter{ opt_in, interests[], consent_version, token_hash, ttl_hours } }
-- Returns { contact_id, organization_id, submission_id, duplicate, newsletter{ id, action } | null }
-- ─────────────────────────────────────────────────────────────
create or replace function public.crm_submit(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_key        uuid := (p->>'idempotency_key')::uuid;
  v_existing   public.form_submissions;
  v_contact    uuid;
  v_org        uuid;
  v_sub        uuid;
  v_recent     int;
  v_area       text := nullif(p->>'area', '');
  v_player     text := nullif(p->>'player_type', '');
  v_org_name   text := nullif(trim(p#>>'{organization,name}'), '');
  v_domain     text;
  v_norm       text;
  v_interests  text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p#>'{newsletter,interests}', '[]'::jsonb))), '{}');
  v_opt_in     boolean := coalesce((p#>>'{newsletter,opt_in}')::boolean, false);
  v_news       jsonb := null;
  v_area_i     text;
begin
  if v_key is null then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  if coalesce(p->>'privacy_version', '') = '' then raise exception 'privacy_version_required' using errcode = '22023'; end if;

  -- Same request again (double click, retry): nothing new
  select * into v_existing from public.form_submissions where idempotency_key = v_key;
  if found then
    return jsonb_build_object('contact_id', v_existing.contact_id, 'organization_id', v_existing.organization_id,
                              'submission_id', v_existing.id, 'duplicate', true, 'newsletter', null);
  end if;

  v_contact := public.crm_upsert_contact(
    (p->'contact') || jsonb_build_object('language', p->>'language', 'source_page', p->>'source_page',
                                         'source_brand', p->>'source_brand', 'utm', coalesce(p->'utm', '{}'::jsonb)),
    p->>'form_id');

  -- Abuse guard per address (the API also limits per IP)
  select count(*) into v_recent from public.form_submissions
  where contact_id = v_contact and submitted_at > now() - interval '1 hour';
  if v_recent >= 5 then raise exception 'rate_limited' using errcode = 'P0001'; end if;

  -- Organisation: same website domain, else same normalised name (only between organisations without a domain)
  if v_org_name is not null then
    v_domain := public.crm_domain(p#>>'{organization,website}');
    v_norm := coalesce(public.crm_normalize_org_name(v_org_name), lower(v_org_name));
    if v_domain is not null then
      select id into v_org from public.organizations where domain = v_domain;
    end if;
    if v_org is null then
      select id into v_org from public.organizations
      where name_normalized = v_norm and (domain is null or v_domain is null)
      order by created_at limit 1;
    end if;
    if v_org is null then
      insert into public.organizations (name, name_normalized, website, domain, industry, country, city)
      values (v_org_name, v_norm, nullif(p#>>'{organization,website}', ''), v_domain,
              nullif(p#>>'{organization,industry}', ''), nullif(p#>>'{organization,country}', ''),
              nullif(trim(p#>>'{organization,city}'), ''))
      on conflict (domain) where domain is not null do update set updated_at = now()
      returning id into v_org;
    else
      -- fill what is missing; an explicit new industry / country / city replaces the old one
      update public.organizations set
        website  = coalesce(website, nullif(p#>>'{organization,website}', '')),
        domain   = coalesce(domain, v_domain),
        industry = coalesce(nullif(p#>>'{organization,industry}', ''), industry),
        country  = coalesce(nullif(p#>>'{organization,country}', ''), country),
        city     = coalesce(nullif(trim(p#>>'{organization,city}'), ''), city)
      where id = v_org;
    end if;

    -- The contact's primary organisation and player type: the latest declaration
    update public.contact_organizations set is_primary = false
    where contact_id = v_contact and organization_id <> v_org and is_primary;
    insert into public.contact_organizations as co (contact_id, organization_id, role, player_type, is_primary)
    values (v_contact, v_org, nullif(trim(p#>>'{contact,job_title}'), ''), v_player, true)
    on conflict (contact_id, organization_id) do update set
      role        = coalesce(excluded.role, co.role),
      player_type = coalesce(excluded.player_type, co.player_type),
      is_primary  = true;

    if v_player is not null then
      insert into public.organization_player_types (organization_id, player_type)
      values (v_org, v_player) on conflict do nothing;
    end if;
  end if;

  insert into public.form_submissions (
    contact_id, organization_id, form_id, form_type, area, player_type, message, data,
    document_path, document_name, document_size, document_link,
    language, source_brand, source_page, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    privacy_version, newsletter_opt_in, editorial_interests, idempotency_key)
  values (
    v_contact, v_org, p->>'form_id', p->>'form_type', v_area, v_player,
    nullif(trim(p->>'message'), ''), coalesce(p->'data', '{}'::jsonb),
    nullif(p#>>'{document,path}', ''), nullif(p#>>'{document,name}', ''), nullif(p#>>'{document,size}', '')::int,
    nullif(p#>>'{document,link}', ''),
    coalesce(nullif(p->>'language', ''), 'it'), coalesce(nullif(p->>'source_brand', ''), 'rainmakers'),
    nullif(p->>'source_page', ''), nullif(p#>>'{utm,utm_source}', ''), nullif(p#>>'{utm,utm_medium}', ''),
    nullif(p#>>'{utm,utm_campaign}', ''), nullif(p#>>'{utm,utm_content}', ''), nullif(p#>>'{utm,utm_term}', ''),
    p->>'privacy_version', v_opt_in, case when v_opt_in then v_interests else '{}' end, v_key)
  returning id into v_sub;

  -- The request itself is consent evidence for processing it (privacy notice shown, version recorded)
  insert into public.consent_events (contact_id, purpose, action, privacy_version, source, evidence)
  values (v_contact, 'request_processing', 'granted', p->>'privacy_version', p->>'form_id',
          jsonb_build_object('submission_id', v_sub));

  if v_area is not null then
    perform public.crm_add_interest(v_contact, v_area, 'form:' || (p->>'form_id'), false);
  end if;

  -- Newsletter: only with the separate, explicit opt-in; never because a request was sent
  if v_opt_in then
    foreach v_area_i in array v_interests loop
      perform public.crm_add_interest(v_contact, v_area_i, 'newsletter:' || (p->>'form_id'), true);
    end loop;
    v_news := public.crm_newsletter_request(v_contact, jsonb_build_object(
      'language', p->>'language', 'consent_source', p->>'form_id',
      'consent_version', p#>>'{newsletter,consent_version}', 'token_hash', p#>>'{newsletter,token_hash}',
      'ttl_hours', p#>>'{newsletter,ttl_hours}', 'evidence', jsonb_build_object('submission_id', v_sub)));
  end if;

  -- Airtable gets everything; Brevo only confirmed subscribers (queued on confirmation)
  perform public.crm_queue_sync('contact', v_contact, 'airtable');
  perform public.crm_queue_sync('form_submission', v_sub, 'airtable');
  if v_org is not null then perform public.crm_queue_sync('organization', v_org, 'airtable'); end if;
  if exists (select 1 from public.newsletter_subscriptions where contact_id = v_contact and status = 'subscribed') then
    perform public.crm_queue_sync('contact', v_contact, 'brevo');
  end if;

  return jsonb_build_object('contact_id', v_contact, 'organization_id', v_org, 'submission_id', v_sub,
                            'duplicate', false, 'newsletter', v_news);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Newsletter: request from the dedicated form
-- p = { email, first_name, language, interests[], consent_version, source (form id), source_page, utm, token_hash, ttl_hours }
-- ─────────────────────────────────────────────────────────────
create or replace function public.crm_newsletter_subscribe(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid;
  v_area    text;
  v_res     jsonb;
begin
  if coalesce(p->>'consent_version', '') = '' then raise exception 'consent_required' using errcode = '22023'; end if;
  v_contact := public.crm_upsert_contact(
    jsonb_build_object('email', p->>'email', 'first_name', p->>'first_name', 'language', p->>'language',
                       'source_page', p->>'source_page', 'source_brand', 'rainmakers', 'utm', coalesce(p->'utm', '{}'::jsonb)),
    coalesce(nullif(p->>'source', ''), 'rm_newsletter_gdi_v1'));
  for v_area in select jsonb_array_elements_text(coalesce(p->'interests', '[]'::jsonb)) loop
    perform public.crm_add_interest(v_contact, v_area, 'newsletter:' || coalesce(nullif(p->>'source', ''), 'rm_newsletter_gdi_v1'), true);
  end loop;
  v_res := public.crm_newsletter_request(v_contact, jsonb_build_object(
    'language', p->>'language', 'consent_source', coalesce(nullif(p->>'source', ''), 'rm_newsletter_gdi_v1'),
    'consent_version', p->>'consent_version', 'token_hash', p->>'token_hash', 'ttl_hours', p->>'ttl_hours'));
  -- a confirmed subscriber who adds interests: Brevo attributes change
  if v_res->>'action' = 'already_subscribed' then perform public.crm_queue_sync('contact', v_contact, 'brevo'); end if;
  return v_res;
end $$;

create or replace function public.crm_newsletter_record_confirmation(p_id uuid, p_ok boolean) returns void
language sql security definer set search_path = public as $$
  update public.newsletter_subscriptions set
    confirmation_sent_at  = case when p_ok then now() else confirmation_sent_at end,
    confirmation_attempts = confirmation_attempts + 1
  where id = p_id
$$;

-- Returns { action: confirmed | already_confirmed | expired | invalid, id, contact_id, email, language, needs_welcome }
create or replace function public.crm_newsletter_confirm(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.newsletter_subscriptions;
  v_email text;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('action', 'invalid'); end if;
  select * into s from public.newsletter_subscriptions where confirm_token_hash = p_token_hash for update;
  if not found then return jsonb_build_object('action', 'invalid'); end if;
  select email into v_email from public.contacts where id = s.contact_id;

  if s.status = 'subscribed' then
    return jsonb_build_object('action', 'already_confirmed', 'id', s.id, 'contact_id', s.contact_id, 'email', v_email,
                              'language', s.language, 'needs_welcome', s.welcome_sent_at is null);
  end if;
  if s.status <> 'pending_confirmation' or s.confirm_expires_at < now() then
    return jsonb_build_object('action', 'expired');
  end if;

  update public.newsletter_subscriptions set status = 'subscribed', confirmed_at = now()
  where id = s.id returning * into s;
  insert into public.consent_events (contact_id, purpose, action, privacy_version, source, evidence)
  values (s.contact_id, 'newsletter', 'confirmed', s.consent_version, 'email_link', jsonb_build_object('subscription_id', s.id));
  perform public.crm_queue_sync('contact', s.contact_id, 'brevo');
  perform public.crm_queue_sync('newsletter_subscription', s.id, 'airtable');

  return jsonb_build_object('action', 'confirmed', 'id', s.id, 'contact_id', s.contact_id, 'email', v_email,
                            'language', s.language, 'needs_welcome', true);
end $$;

-- Unsubscribe (link in every newsletter email, or later from Brevo). Returns { action: unsubscribed | already | not_found }
create or replace function public.crm_newsletter_unsubscribe(p_contact uuid, p_source text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.newsletter_subscriptions;
begin
  select * into s from public.newsletter_subscriptions
  where contact_id = p_contact and newsletter_code = 'gocce_di_innovazione' for update;
  if not found then return jsonb_build_object('action', 'not_found'); end if;
  if s.status = 'unsubscribed' then return jsonb_build_object('action', 'already'); end if;

  update public.newsletter_subscriptions set status = 'unsubscribed', unsubscribed_at = now(),
    confirm_token_hash = null, confirm_expires_at = null
  where id = s.id;
  insert into public.consent_events (contact_id, purpose, action, privacy_version, source, evidence)
  values (s.contact_id, 'newsletter', 'withdrawn', s.consent_version, left(coalesce(nullif(p_source, ''), 'email_link'), 80),
          jsonb_build_object('subscription_id', s.id));
  perform public.crm_queue_sync('contact', s.contact_id, 'brevo');
  perform public.crm_queue_sync('newsletter_subscription', s.id, 'airtable');
  return jsonb_build_object('action', 'unsubscribed');
end $$;

-- Same, by email: unsubscribes received from Brevo (webhook, prepared in app/api/webhooks/brevo)
create or replace function public.crm_newsletter_unsubscribe_email(p_email text, p_source text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid;
begin
  select id into v_contact from public.contacts where email = lower(trim(p_email))::citext;
  if v_contact is null then return jsonb_build_object('action', 'not_found'); end if;
  return public.crm_newsletter_unsubscribe(v_contact, p_source);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Acknowledgement / welcome emails: at most once, claimed atomically, released on failure (max 5 attempts)
-- p_kind: 'submission' (form_submissions.id) or 'newsletter' (newsletter_subscriptions.id)
-- ─────────────────────────────────────────────────────────────
create or replace function public.crm_claim_ack(p_kind text, p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v jsonb;
begin
  if p_kind = 'submission' then
    update public.form_submissions f set ack_claimed_at = now(), ack_attempts = ack_attempts + 1
    where f.id = p_id and f.ack_sent_at is null and f.ack_attempts < 5
      and (f.ack_claimed_at is null or f.ack_claimed_at < now() - interval '15 minutes')
    returning jsonb_build_object('email', (select email from public.contacts where id = f.contact_id),
                                 'first_name', (select first_name from public.contacts where id = f.contact_id),
                                 'language', f.language, 'form_type', f.form_type) into v;
  elsif p_kind = 'newsletter' then
    update public.newsletter_subscriptions n set welcome_claimed_at = now(), welcome_attempts = welcome_attempts + 1
    where n.id = p_id and n.status = 'subscribed' and n.welcome_sent_at is null and n.welcome_attempts < 5
      and (n.welcome_claimed_at is null or n.welcome_claimed_at < now() - interval '15 minutes')
    returning jsonb_build_object('email', (select email from public.contacts where id = n.contact_id),
                                 'contact_id', n.contact_id, 'language', n.language) into v;
  else
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  return coalesce(v, '{}'::jsonb);
end $$;

create or replace function public.crm_finish_ack(p_kind text, p_id uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'submission' then
    update public.form_submissions set ack_sent_at = case when p_ok then now() end, ack_claimed_at = case when p_ok then ack_claimed_at end
    where id = p_id and ack_sent_at is null;
  elsif p_kind = 'newsletter' then
    update public.newsletter_subscriptions set welcome_sent_at = case when p_ok then now() end,
      welcome_claimed_at = case when p_ok then welcome_claimed_at end
    where id = p_id and welcome_sent_at is null;
  else
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
end $$;

-- What the daily job still has to send (acknowledgements and welcomes not sent yet, within 7 days)
create or replace function public.crm_pending_emails() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'submissions', coalesce((select jsonb_agg(id) from (
      select id from public.form_submissions
      where ack_sent_at is null and ack_attempts < 5 and form_type <> 'review' and submitted_at > now() - interval '7 days'
      order by submitted_at limit 100) s), '[]'::jsonb),
    'newsletter', coalesce((select jsonb_agg(id) from (
      select id from public.newsletter_subscriptions
      where status = 'subscribed' and welcome_sent_at is null and welcome_attempts < 5 and confirmed_at > now() - interval '7 days'
      order by confirmed_at limit 100) n), '[]'::jsonb))
$$;

-- Records the outcome of a sync attempt (used once the sync is enabled)
create or replace function public.crm_record_sync(p_type text, p_id uuid, p_destination text, p_status text,
                                                  p_external_id text, p_error text) returns void
language sql security definer set search_path = public as $$
  insert into public.external_sync_status as e (record_type, record_id, destination, sync_status, external_id, last_error,
                                                attempts, last_synced_at)
  values (p_type, p_id, p_destination, p_status, p_external_id, left(p_error, 300), 1,
          case when p_status = 'synced' then now() end)
  on conflict (record_type, record_id, destination) do update set
    sync_status    = excluded.sync_status,
    external_id    = coalesce(excluded.external_id, e.external_id),
    last_error     = excluded.last_error,
    attempts       = e.attempts + 1,
    last_synced_at = coalesce(excluded.last_synced_at, e.last_synced_at)
$$;

-- ─────────────────────────────────────────────────────────────
-- Projections for the future syncs and for manual exports (security_invoker: same rights as the caller, so
-- anon / authenticated see nothing; service_role and the SQL editor see everything)
-- ─────────────────────────────────────────────────────────────
-- Brevo: one row per contact. Rule: player type, industry and country come from the contact's PRIMARY organisation
-- (the latest one declared); interests are the editorial ones only (explicit choices for the newsletter); the full
-- history stays in Supabase. in_newsletter_list is true only for confirmed subscribers.
create or replace view public.crm_brevo_contacts with (security_invoker = true) as
select
  c.id                                   as supabase_contact_id,
  c.email,
  c.first_name                           as firstname,
  c.last_name                            as lastname,
  co.player_type,
  o.industry,
  o.country,
  coalesce(bool_or(ci.area = 'giveback' and ci.editorial), false)              as interest_giveback,
  coalesce(bool_or(ci.area = 'open_venture_building' and ci.editorial), false) as interest_ovb,
  coalesce(bool_or(ci.area = 'advisory' and ci.editorial), false)              as interest_advisory,
  c.first_form_id                        as source_form,
  c.first_source_brand                   as source_brand,
  n.status                               as newsletter_status,
  (n.status = 'subscribed')              as in_newsletter_list,
  c.language
from public.contacts c
left join public.contact_organizations co on co.contact_id = c.id and co.is_primary
left join public.organizations o on o.id = co.organization_id
left join public.contact_interests ci on ci.contact_id = c.id
left join public.newsletter_subscriptions n on n.contact_id = c.id and n.newsletter_code = 'gocce_di_innovazione'
group by c.id, co.player_type, o.industry, o.country, n.status;

revoke all on public.crm_brevo_contacts from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Execute rights: service_role only
-- ─────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'crm_queue_sync(text, uuid, text)', 'crm_upsert_contact(jsonb, text)', 'crm_add_interest(uuid, text, text, boolean)',
    'crm_newsletter_request(uuid, jsonb)', 'crm_submit(jsonb)', 'crm_newsletter_subscribe(jsonb)',
    'crm_newsletter_record_confirmation(uuid, boolean)', 'crm_newsletter_confirm(text)',
    'crm_newsletter_unsubscribe(uuid, text)', 'crm_newsletter_unsubscribe_email(text, text)', 'crm_claim_ack(text, uuid)', 'crm_finish_ack(text, uuid, boolean)',
    'crm_pending_emails()', 'crm_record_sync(text, uuid, text, text, text, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function public.%s to service_role', f);
    end if;
  end loop;
end $$;
