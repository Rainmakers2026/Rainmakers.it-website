-- Rollback 0011: crm_newsletter_subscribe as in 0010 (last_name not passed to the contact)
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
  if v_res->>'action' = 'already_subscribed' then perform public.crm_queue_sync('contact', v_contact, 'brevo'); end if;
  return v_res;
end $$;
