-- 0011 (2026-11-12): the "Gocce di Innovazione" form now asks first name, last name and email (all required).
-- crm_newsletter_subscribe also passes last_name to crm_upsert_contact (which never blanks an existing value).
-- p = { email, first_name, last_name, language, interests[], consent_version, source (form id), source_page, utm, token_hash, ttl_hours }
create or replace function public.crm_newsletter_subscribe(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid;
  v_area    text;
  v_res     jsonb;
begin
  if coalesce(p->>'consent_version', '') = '' then raise exception 'consent_required' using errcode = '22023'; end if;
  v_contact := public.crm_upsert_contact(
    jsonb_build_object('email', p->>'email', 'first_name', p->>'first_name', 'last_name', p->>'last_name', 'language', p->>'language',
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

-- create or replace keeps the existing grants (service_role only, from 0010)
