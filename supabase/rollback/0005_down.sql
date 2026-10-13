-- Rollback of 0005_newsletter_brevo.sql.
-- ⚠ Drops consent evidence (confirmed_at, consent_version) and sync/welcome tracking columns.
--   Export newsletter_subscribers first if it holds real subscriptions. Contacts already added to the
--   Brevo list "Contatti" stay in Brevo — remove them there if required.

drop function if exists public.rm_brevo_pending_work();
drop function if exists public.rm_release_welcome(text, uuid);
drop function if exists public.rm_claim_welcome(text, uuid);
drop function if exists public.newsletter_record_sync(uuid, boolean, text);
drop function if exists public.newsletter_confirm(text);
drop function if exists public.newsletter_record_confirmation(uuid, boolean);
drop function if exists public.newsletter_subscribe(jsonb);

alter table public.join_applications
  drop column if exists welcome_attempts,
  drop column if exists welcome_sent_at;

drop trigger if exists newsletter_set_updated_at on public.newsletter_subscribers;
drop index if exists public.newsletter_confirm_token_idx;
alter table public.newsletter_subscribers
  drop column if exists updated_at,
  drop column if exists welcome_attempts,
  drop column if exists welcome_sent_at,
  drop column if exists brevo_last_error,
  drop column if exists brevo_attempts,
  drop column if exists brevo_synced_at,
  drop column if exists brevo_sync_status,
  drop column if exists unsubscribed_at,
  drop column if exists confirmed_at,
  drop column if exists confirmation_sent_at,
  drop column if exists confirmation_status,
  drop column if exists confirm_expires_at,
  drop column if exists confirm_token_hash,
  drop column if exists source,
  drop column if exists consent_version;
