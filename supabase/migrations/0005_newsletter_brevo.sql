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
