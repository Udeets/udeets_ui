-- Revert product rename: stored kind bucket "Deets" -> "Posts" (matches app after rollback).
alter table public.deets drop constraint if exists deets_kind_check;

update public.deets
set kind = 'Posts'
where kind = 'Deets';

alter table public.deets add constraint deets_kind_check
  check (kind in ('Posts', 'Notices', 'Photos', 'News', 'Deals', 'Hazards', 'Alerts'));
