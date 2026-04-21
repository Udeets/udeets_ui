-- Allow users to change their reaction emoji (reaction_type) on an existing like.
-- Previously only SELECT / INSERT / DELETE existed; UPDATE was blocked by RLS.

drop policy if exists "Users can update own deet likes" on public.deet_likes;

create policy "Users can update own deet likes"
  on public.deet_likes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
