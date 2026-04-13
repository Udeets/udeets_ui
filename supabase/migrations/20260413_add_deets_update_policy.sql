-- ============================================================
-- Allow authenticated users to update denormalized counts on deets
-- (like_count, comment_count, view_count).
-- Without this, all .update() calls on deets were silently blocked
-- by RLS — which caused like/comment/view counts to never persist.
-- ============================================================

drop policy if exists "Authenticated users can update deet counts" on public.deets;
create policy "Authenticated users can update deet counts"
on public.deets
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);
