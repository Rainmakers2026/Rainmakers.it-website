-- Rollback of 0007_reviews.sql.
-- ⚠ Drops the reviews table and its rows. Export it first (Table editor → Export to CSV) if any real
--   review exists. lead_events rows with kind = 'review' are relabelled 'contact' so the old check holds.

drop function if exists public.review_mark_notified(uuid);
drop function if exists public.submit_review(jsonb);
drop table if exists public.reviews;

update public.lead_events set kind = 'contact' where kind = 'review';
alter table public.lead_events drop constraint if exists lead_events_kind_check;
alter table public.lead_events add constraint lead_events_kind_check
  check (kind is null or kind in ('contact', 'join', 'community'));
