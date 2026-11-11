-- Tests for 0010_crm.sql — run on a TEST project only (SQL editor or psql), after the migration. Every block raises
-- an exception on failure and everything is rolled back at the end, so no test data is left behind.
-- Verified on 2026-11-11 against PostgreSQL (PGlite) with migration 0010 applied twice (re-runnable).

begin;

-- helper: a submission payload
create or replace function pg_temp.req(p_key text, p_email text, p_form text, p_type text, p_area text, p_player text,
                                       p_org text, p_site text, p_news boolean default false, p_interests jsonb default '[]')
returns jsonb language sql as $$
  select jsonb_build_object(
    'idempotency_key', p_key, 'form_id', p_form, 'form_type', p_type, 'area', p_area, 'language', 'it',
    'source_brand', 'rainmakers', 'source_page', '/it', 'privacy_version', 'test-v1',
    'utm', jsonb_build_object('utm_source', 'newsletter', 'utm_campaign', 'test'),
    'contact', jsonb_build_object('email', p_email, 'first_name', 'Marta', 'last_name', 'Rossi', 'job_title', 'CEO'),
    'organization', case when p_org is null then null else jsonb_build_object('name', p_org, 'website', p_site, 'industry', 'fintech', 'country', 'IT', 'city', 'Milano') end,
    'player_type', p_player, 'message', 'Ciao', 'data', jsonb_build_object('startup_stage', 'seed'),
    'newsletter', jsonb_build_object('opt_in', p_news, 'interests', p_interests, 'consent_version', 'nl-test',
                                     'token_hash', repeat('a', 63) || substr(p_key, 1, 1), 'ttl_hours', 48))
$$;

-- 1. New startup contact
do $$
declare r jsonb; c public.contacts;
begin
  r := public.crm_submit(pg_temp.req('11111111-1111-4111-8111-111111111111', 'Marta.Rossi@Example.com ', 'rm_startup_v1',
                                     'startup_application', 'open_venture_building', 'startup', 'Acme S.r.l.', 'https://www.acme.it/'));
  assert (r->>'duplicate')::boolean = false, '1: not a duplicate';
  select * into c from public.contacts where id = (r->>'contact_id')::uuid;
  assert c.email = 'marta.rossi@example.com', '1: email normalised';
  assert c.first_form_id = 'rm_startup_v1' and c.first_utm->>'utm_source' = 'newsletter', '1: first source kept';
  assert (select domain from public.organizations where id = (r->>'organization_id')::uuid) = 'acme.it', '1: domain';
  assert (select player_type from public.contact_organizations where contact_id = c.id and is_primary) = 'startup', '1: player type';
  assert (select count(*) from public.consent_events where contact_id = c.id and purpose = 'request_processing') = 1, '1: consent event';
  assert not exists (select 1 from public.newsletter_subscriptions where contact_id = c.id), '1: no newsletter without opt-in';
  assert (select count(*) from public.external_sync_status where destination = 'airtable' and sync_status = 'pending') = 3, '1: airtable queued';
  assert not exists (select 1 from public.external_sync_status where destination = 'brevo'), '1: nothing for brevo';
end $$;

-- 2. Same contact, second form (different case in the email): one contact, two submissions, names not blanked
do $$
declare r jsonb; p jsonb;
begin
  p := pg_temp.req('22222222-2222-4222-8222-222222222222', 'MARTA.ROSSI@example.com', 'rm_company_v1',
                   'company_request', 'advisory', 'startup', 'ACME srl', 'acme.it');
  p := jsonb_set(p, '{contact,first_name}', 'null'::jsonb);
  r := public.crm_submit(p);
  assert (select count(*) from public.contacts) = 1, '2: one contact';
  assert (select count(*) from public.form_submissions) = 2, '2: two submissions';
  assert (select first_name from public.contacts) = 'Marta', '2: name not blanked';
  assert (select count(*) from public.organizations) = 1, '2: same organisation (domain)';
  assert (select first_form_id from public.contacts) = 'rm_startup_v1', '2: first source unchanged';
end $$;

-- 3. Organisation shared by two contacts; the second one without website matches by normalised name
do $$
declare r jsonb;
begin
  r := public.crm_submit(pg_temp.req('33333333-3333-4333-8333-333333333333', 'luca@acme.it', 'rm_invest_v1',
                                     'investor_application', 'advisory', 'cvc', 'Acme', null));
  assert (select count(*) from public.organizations) = 1, '3: still one organisation';
  assert (select count(*) from public.contact_organizations where organization_id = (r->>'organization_id')::uuid) = 2, '3: two contacts';
  assert (select count(*) from public.organization_player_types where organization_id = (r->>'organization_id')::uuid) = 2, '3: two player types on the org';
end $$;

-- 4. Contact interested in several areas (from the forms above: open_venture_building + advisory), no editorial yet
do $$
begin
  assert (select count(*) from public.contact_interests ci join public.contacts c on c.id = ci.contact_id
          where c.email = 'marta.rossi@example.com') = 2, '4: two areas';
  assert not exists (select 1 from public.contact_interests where editorial), '4: no editorial interest without newsletter';
end $$;

-- 5. Form without newsletter → no subscription (checked in 1); 6. form with newsletter opt-in → pending, double opt-in
do $$
declare r jsonb; s public.newsletter_subscriptions; c jsonb;
begin
  r := public.crm_submit(pg_temp.req('44444444-4444-4444-8444-444444444444', 'giulia@example.org', 'rm_giveback_v1',
                                     'giveback_application', 'giveback', null, null, null, true, '["giveback","advisory"]'));
  assert r#>>'{newsletter,action}' = 'send_confirmation', '6: confirmation to send';
  select * into s from public.newsletter_subscriptions where id = (r#>>'{newsletter,id}')::uuid;
  assert s.status = 'pending_confirmation', '6: pending';
  assert (select count(*) from public.contact_interests where contact_id = s.contact_id and editorial) = 2, '6: editorial interests';
  assert not exists (select 1 from public.external_sync_status where destination = 'brevo'), '6: not sent to Brevo before confirmation';
  -- confirm with the token
  c := public.crm_newsletter_confirm(s.confirm_token_hash);
  assert c->>'action' = 'confirmed', '6: confirmed';
  assert (select status from public.newsletter_subscriptions where id = s.id) = 'subscribed', '6: subscribed';
  assert exists (select 1 from public.external_sync_status where destination = 'brevo' and record_id = s.contact_id), '6: queued for Brevo after confirmation';
  assert public.crm_newsletter_confirm(s.confirm_token_hash)->>'action' = 'already_confirmed', '6: second click';
  -- dedicated newsletter form again: already subscribed, interest added
  assert public.crm_newsletter_subscribe(jsonb_build_object('email', 'giulia@example.org', 'language', 'it',
          'interests', '["open_venture_building"]'::jsonb, 'consent_version', 'nl-test', 'token_hash', repeat('b', 64)))->>'action'
         = 'already_subscribed', '6: already';
  assert (select count(*) from public.contact_interests where contact_id = s.contact_id and editorial) = 3, '6: interest added';
  -- unsubscribe, then the preference is kept until a new explicit request
  assert public.crm_newsletter_unsubscribe(s.contact_id, 'email_link')->>'action' = 'unsubscribed', '6: unsubscribed';
  assert public.crm_newsletter_unsubscribe(s.contact_id, 'email_link')->>'action' = 'already', '6: unsubscribe twice';
  assert public.crm_newsletter_unsubscribe_email('GIULIA@example.org', 'brevo')->>'action' = 'already', '6: by email (Brevo)';
  assert public.crm_newsletter_unsubscribe_email('nobody@example.org', 'brevo')->>'action' = 'not_found', '6: unknown email';
  r := public.crm_submit(pg_temp.req('55555555-5555-4555-8555-555555555555', 'giulia@example.org', 'rm_giveback_v1',
                                     'giveback_application', 'giveback', null, null, null, false));
  assert (select status from public.newsletter_subscriptions where id = s.id) = 'unsubscribed', '6: a form without opt-in does not resubscribe';
  assert (select count(*) from public.consent_events where contact_id = s.contact_id and purpose = 'newsletter') = 3, '6: requested, confirmed, withdrawn';
end $$;

-- 7. Repeated request / double click: same idempotency key → same submission, nothing new
do $$
declare r jsonb; n int;
begin
  select count(*) into n from public.form_submissions;
  r := public.crm_submit(pg_temp.req('11111111-1111-4111-8111-111111111111', 'marta.rossi@example.com', 'rm_startup_v1',
                                     'startup_application', 'open_venture_building', 'startup', 'Acme S.r.l.', 'https://www.acme.it/'));
  assert (r->>'duplicate')::boolean, '7: duplicate';
  assert (select count(*) from public.form_submissions) = n, '7: no new row';
end $$;

-- 8. Invalid input is refused by the constraints
do $$
begin
  begin
    perform public.crm_submit(pg_temp.req('66666666-6666-4666-8666-666666666666', 'x@example.com', 'rm_startup_v1',
                                          'startup_application', 'open_venture_building', 'hacker', 'X', null));
    raise exception '8: invalid player type accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.crm_submit(pg_temp.req('77777777-7777-4777-8777-777777777777', 'not-an-email', 'rm_startup_v1',
                                          'startup_application', 'open_venture_building', 'startup', 'X', null));
    raise exception '8: invalid email accepted';
  exception when check_violation then null;
  end;
  -- per-address limit: 5 submissions per hour
  begin
    for i in 1..6 loop
      perform public.crm_submit(pg_temp.req(gen_random_uuid()::text, 'flood@example.com', 'rm_giveback_v1',
                                            'giveback_application', 'giveback', null, null, null));
    end loop;
    raise exception '8: rate limit not applied';
  exception when raise_exception then
    if sqlerrm <> 'rate_limited' then raise; end if;
  end;
end $$;

-- 8b. Unauthorised access: anon and authenticated read nothing and cannot call the functions
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    execute format('set local role %I', r);
    begin
      perform 1 from public.contacts limit 1;
      raise exception '8b: % can read contacts', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.crm_submit('{}'::jsonb);
      raise exception '8b: % can call crm_submit', r;
    exception when insufficient_privilege then null;
    end;
    reset role;
  end loop;
end $$;

-- 9. Acknowledgement email claimed once
do $$
declare v uuid := (select id from public.form_submissions order by submitted_at limit 1);
begin
  assert public.crm_claim_ack('submission', v) ? 'email', '9: first claim';
  assert public.crm_claim_ack('submission', v) = '{}'::jsonb, '9: second claim refused';
  perform public.crm_finish_ack('submission', v, false);
  assert public.crm_claim_ack('submission', v) ? 'email', '9: released after failure';
  perform public.crm_finish_ack('submission', v, true);
  assert public.crm_claim_ack('submission', v) = '{}'::jsonb, '9: never after success';
end $$;

-- 10. Brevo projection: primary organisation's player type, editorial interests only, list only when subscribed
do $$
declare b public.crm_brevo_contacts;
begin
  select * into b from public.crm_brevo_contacts where email = 'giulia@example.org';
  assert b.interest_giveback and b.interest_advisory and b.interest_ovb, '10: editorial interests projected';
  assert not b.in_newsletter_list and b.newsletter_status = 'unsubscribed', '10: unsubscribed not in the list';
  select * into b from public.crm_brevo_contacts where email = 'marta.rossi@example.com';
  assert b.player_type = 'startup' and b.industry = 'fintech' and b.country = 'IT', '10: primary organisation';
  assert not b.interest_advisory, '10: form areas are not editorial interests';
  assert b.source_form = 'rm_startup_v1', '10: first source form';
end $$;

select 'crm tests passed' as result;
rollback;
