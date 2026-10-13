alter table public.leads
  add column if not exists application jsonb;

-- Keep the original submit_lead validation, per-email limit and event log while
-- storing the structured pitch application alongside the standard lead fields.
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
    profile_type, interest, application, language, consent, consent_version, consent_at, utm
  ) values (
    p->>'first_name', p->>'last_name', p->>'email', p->>'company', p->>'role',
    nullif(p->>'website_or_linkedin', ''),
    p->>'profile_type', nullif(p->>'interest', ''), p->'application', v_lang,
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
    application         = coalesce(excluded.application, l.application),
    language            = excluded.language,
    consent             = true,
    consent_version     = excluded.consent_version,
    consent_at          = now()
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
