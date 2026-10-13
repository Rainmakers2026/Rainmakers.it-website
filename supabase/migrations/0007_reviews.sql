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
