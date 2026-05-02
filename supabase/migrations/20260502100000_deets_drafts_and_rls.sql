-- ============================================================
-- Deet drafts: is_published + SELECT/UPDATE RLS + interaction
-- policies scoped to published deets (drafts = author only).
-- Denormalized counts use SECURITY DEFINER RPC (replaces broad UPDATE).
-- ============================================================

-- 1) Column
alter table public.deets
  add column if not exists is_published boolean not null default true;

update public.deets set is_published = true where is_published is null;

create index if not exists deets_hub_published_created_at_idx
  on public.deets (hub_id, created_at desc)
  where is_published = true;

-- 2) RPC for count columns only (client fire-and-forget)
create or replace function public.apply_deet_denormalized_count(
  p_deet_id uuid,
  p_column text,
  p_value integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  case p_column
    when 'like_count' then
      update public.deets set like_count = p_value where id = p_deet_id;
    when 'comment_count' then
      update public.deets set comment_count = p_value where id = p_deet_id;
    when 'view_count' then
      update public.deets set view_count = p_value where id = p_deet_id;
    when 'share_count' then
      update public.deets set share_count = p_value where id = p_deet_id;
    else
      raise exception 'invalid column %', p_column;
  end case;
end;
$$;

revoke all on function public.apply_deet_denormalized_count(uuid, text, integer) from public;
grant execute on function public.apply_deet_denormalized_count(uuid, text, integer) to authenticated;

-- 3) deets SELECT — published for everyone; drafts only for author
drop policy if exists "Authenticated users can read deets" on public.deets;

create policy "Users read published or own draft deets"
  on public.deets
  for select
  to authenticated
  using (
    is_published = true
    or created_by = auth.uid()
  );

-- 4) deets UPDATE — drop permissive count policy; authors + hub staff
drop policy if exists "Authenticated users can update deet counts" on public.deets;

create policy "Deet authors update own deets"
  on public.deets
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Hub creators update published deets in their hub"
  on public.deets
  for update
  to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.hubs h
      where h.id = deets.hub_id
        and h.created_by = auth.uid()::text
    )
  )
  with check (
    is_published = true
    and exists (
      select 1
      from public.hubs h
      where h.id = deets.hub_id
        and h.created_by = auth.uid()::text
    )
  );

create policy "Hub admins update published deets in their hub"
  on public.deets
  for update
  to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.hub_members hm
      where hm.hub_id = deets.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  )
  with check (
    is_published = true
    and exists (
      select 1
      from public.hub_members hm
      where hm.hub_id = deets.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

-- 5) Helper: published deet visible to reader (for child tables)
-- (inline in policies below)

-- 6) deet_likes
drop policy if exists "Anyone can read deet likes" on public.deet_likes;
create policy "Read deet likes for visible deets"
  on public.deet_likes for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = deet_likes.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Users can like deets" on public.deet_likes;
create policy "Users can like published deets"
  on public.deet_likes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = deet_likes.deet_id and d.is_published = true
    )
  );

drop policy if exists "Users can update own deet likes" on public.deet_likes;
create policy "Users can update own deet likes"
  on public.deet_likes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike deets" on public.deet_likes;
create policy "Users can unlike deets"
  on public.deet_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- 7) deet_comments
drop policy if exists "Anyone can read deet comments" on public.deet_comments;
create policy "Read deet comments for visible deets"
  on public.deet_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = deet_comments.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Users can comment on deets" on public.deet_comments;
create policy "Users can comment on published deets"
  on public.deet_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = deet_comments.deet_id and d.is_published = true
    )
  );

-- 8) deet_views
drop policy if exists "Anyone can read deet views" on public.deet_views;
create policy "Read deet views for visible deets"
  on public.deet_views for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = deet_views.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Users can record deet views" on public.deet_views;
create policy "Users can record views on published deets"
  on public.deet_views for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = deet_views.deet_id and d.is_published = true
    )
  );

drop policy if exists "Users can update own deet views" on public.deet_views;
create policy "Users can update own deet views"
  on public.deet_views for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9) deet_shares
drop policy if exists "Anyone can view deet shares" on public.deet_shares;
create policy "Read deet shares for visible deets"
  on public.deet_shares for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = deet_shares.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Authenticated users can share deets" on public.deet_shares;
create policy "Authenticated users can share published deets"
  on public.deet_shares for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = deet_shares.deet_id and d.is_published = true
    )
  );

-- 10) poll_votes
drop policy if exists "Anyone can read poll votes" on public.poll_votes;
create policy "Read poll votes for visible deets"
  on public.poll_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = poll_votes.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Users can insert own votes" on public.poll_votes;
create policy "Users can insert votes on published deets"
  on public.poll_votes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = poll_votes.deet_id and d.is_published = true
    )
  );

drop policy if exists "Users can delete own votes" on public.poll_votes;
create policy "Users can delete own votes"
  on public.poll_votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- 11) survey_responses
drop policy if exists "Anyone can read survey responses" on public.survey_responses;
create policy "Read survey responses for visible deets"
  on public.survey_responses for select
  to authenticated
  using (
    exists (
      select 1 from public.deets d
      where d.id = survey_responses.deet_id
        and (d.is_published = true or d.created_by = auth.uid())
    )
  );

drop policy if exists "Users can insert own survey responses" on public.survey_responses;
create policy "Users can insert survey responses on published deets"
  on public.survey_responses for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.deets d
      where d.id = survey_responses.deet_id and d.is_published = true
    )
  );

drop policy if exists "Users can delete own survey responses" on public.survey_responses;
create policy "Users can delete own survey responses"
  on public.survey_responses for delete
  to authenticated
  using (auth.uid() = user_id);

-- 12) Unread hub helper: only published deets count as activity for others
create or replace function public.user_hubs_with_unread()
returns table(hub_id uuid)
language sql
stable
security invoker
as $$
  select m.hub_id
  from public.hub_members m
  where m.user_id = auth.uid()
    and m.status = 'active'
    and exists (
      select 1
      from public.deets d
      where d.hub_id = m.hub_id
        and d.is_published = true
        and d.created_at > coalesce(m.last_seen_at, 'epoch'::timestamptz)
        and d.created_by is distinct from m.user_id
    );
$$;
