-- Rollback of 0010_crm.sql. DESTRUCTIVE: drops the CRM tables and their data. Export them first and run only on
-- explicit approval; the tables of 0001–0009 are not touched.

drop view if exists public.crm_brevo_contacts;
drop function if exists public.crm_record_sync(text, uuid, text, text, text, text);
drop function if exists public.crm_pending_emails();
drop function if exists public.crm_finish_ack(text, uuid, boolean);
drop function if exists public.crm_claim_ack(text, uuid);
drop function if exists public.crm_newsletter_unsubscribe_email(text, text);
drop function if exists public.crm_newsletter_unsubscribe(uuid, text);
drop function if exists public.crm_newsletter_confirm(text);
drop function if exists public.crm_newsletter_record_confirmation(uuid, boolean);
drop function if exists public.crm_newsletter_subscribe(jsonb);
drop function if exists public.crm_submit(jsonb);
drop function if exists public.crm_newsletter_request(uuid, jsonb);
drop function if exists public.crm_add_interest(uuid, text, text, boolean);
drop function if exists public.crm_upsert_contact(jsonb, text);
drop function if exists public.crm_queue_sync(text, uuid, text);
drop function if exists public.crm_domain(text);
drop function if exists public.crm_normalize_org_name(text);

drop table if exists public.external_sync_status;
drop table if exists public.consent_events;
drop table if exists public.newsletter_subscriptions;
drop table if exists public.contact_interests;
drop table if exists public.form_submissions;
drop table if exists public.organization_player_types;
drop table if exists public.contact_organizations;
drop table if exists public.organizations;
drop table if exists public.contacts;

drop function if exists public.crm_form_types();
drop function if exists public.crm_industries();
drop function if exists public.crm_player_types();
drop function if exists public.crm_areas();
