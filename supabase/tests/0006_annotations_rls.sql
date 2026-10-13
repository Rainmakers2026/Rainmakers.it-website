-- RLS tests for 0006_site_annotations.sql — run in the Supabase SQL editor AFTER the migration.
-- Everything runs inside one transaction that is ROLLED BACK at the end: no data is left behind.
-- It creates three throw-away auth users (editor, admin, outsider) and impersonates each one the
-- same way PostgREST does (role + request.jwt.claims). Every check raises an error if it fails;
-- if the script ends with "ALL ANNOTATION RLS TESTS PASSED", the policies behave as documented.

begin;

-- Throw-away users (rolled back at the end)
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000e1', 'rls-editor@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a1', 'rls-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000f1', 'rls-outsider@example.test', 'authenticated', 'authenticated');
insert into public.team_members (user_id, email, role) values
  ('00000000-0000-4000-8000-0000000000e1', 'rls-editor@example.test', 'editor'),
  ('00000000-0000-4000-8000-0000000000a1', 'rls-admin@example.test', 'admin');

create or replace function pg_temp.act_as(uid text, email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', email, 'role', 'authenticated')::text, true);
end $$;

do $$
declare n int; v_id uuid; v_other uuid;
begin
  -- 1. anon sees nothing and cannot insert
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform count(*) from public.site_annotations;
    raise exception 'FAIL: anon could read site_annotations';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.site_annotations (page_path, locale, comment) values ('/it', 'it', 'x');
    raise exception 'FAIL: anon could insert';
  exception when insufficient_privilege then null; end;

  -- 2. editor creates an annotation; author comes from the JWT, not from the payload
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000e1', 'rls-editor@example.test');
  insert into public.site_annotations (page_path, locale, section_id, comment, author_id, author_email, status)
  values ('/it', 'it', 'founder', 'Editor note', '00000000-0000-4000-8000-0000000000a1', 'spoof@example.test', 'resolved')
  returning id into v_id;
  select count(*) into n from public.site_annotations
  where id = v_id and author_id = '00000000-0000-4000-8000-0000000000e1' and author_email = 'rls-editor@example.test' and status = 'open';
  if n <> 1 then raise exception 'FAIL: author/status not forced from JWT'; end if;

  -- 3. admin creates one; editor can read it and resolve it, but not rewrite its text or delete it
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1', 'rls-admin@example.test');
  insert into public.site_annotations (page_path, locale, comment) values ('/en', 'en', 'Admin note') returning id into v_other;

  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000e1', 'rls-editor@example.test');
  select count(*) into n from public.site_annotations where id in (v_id, v_other);
  if n <> 2 then raise exception 'FAIL: editor cannot read team annotations'; end if;
  update public.site_annotations set status = 'resolved' where id = v_other;
  select count(*) into n from public.site_annotations where id = v_other and status = 'resolved' and resolved_by = '00000000-0000-4000-8000-0000000000e1';
  if n <> 1 then raise exception 'FAIL: editor cannot resolve'; end if;
  begin
    update public.site_annotations set comment = 'hijacked' where id = v_other;
    raise exception 'FAIL: editor edited someone else''s text';
  exception when insufficient_privilege then null; end;
  delete from public.site_annotations where id = v_other;
  select count(*) into n from public.site_annotations where id = v_other;
  if n <> 1 then raise exception 'FAIL: editor could delete'; end if;
  update public.site_annotations set comment = 'Edited by author' where id = v_id;  -- own text: allowed

  -- 4. outsider (signed in, not in team) sees and changes nothing
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000f1', 'rls-outsider@example.test');
  select count(*) into n from public.site_annotations;
  if n <> 0 then raise exception 'FAIL: outsider can read annotations'; end if;
  update public.site_annotations set status = 'archived' where id = v_id;
  begin
    insert into public.site_annotations (page_path, locale, comment) values ('/it', 'it', 'outsider');
    raise exception 'FAIL: outsider could insert';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.team_members;
  if n <> 0 then raise exception 'FAIL: outsider sees team_members'; end if;
  begin
    insert into public.team_members (user_id, email) values ('00000000-0000-4000-8000-0000000000f1', 'rls-outsider@example.test');
    raise exception 'FAIL: outsider added themselves to the team';
  exception when insufficient_privilege then null; end;

  -- 5. editor cannot promote themselves; admin can delete
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000e1', 'rls-editor@example.test');
  begin
    update public.team_members set role = 'admin' where user_id = '00000000-0000-4000-8000-0000000000e1';
    raise exception 'FAIL: editor changed own role';
  exception when insufficient_privilege then null; end;
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1', 'rls-admin@example.test');
  select count(*) into n from public.site_annotations where id = v_id and status = 'open';
  if n <> 1 then raise exception 'FAIL: outsider update was not ignored'; end if;
  delete from public.site_annotations where id = v_other;
  select count(*) into n from public.site_annotations where id = v_other;
  if n <> 0 then raise exception 'FAIL: admin cannot delete'; end if;

  raise notice 'ALL ANNOTATION RLS TESTS PASSED';
end $$;

rollback;
