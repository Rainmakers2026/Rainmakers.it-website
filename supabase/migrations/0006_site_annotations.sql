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
