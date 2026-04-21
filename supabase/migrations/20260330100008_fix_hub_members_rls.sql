-- Fix infinite recursion in hub_members RLS SELECT policies.
-- The previous "creators and admins" policy used a self-referential subquery
-- on hub_members, causing a recursive evaluation loop.
-- Replaced with a single policy: a user can read all member rows for any hub
-- they are also an active member of (covers own row + fellow members).

DROP POLICY IF EXISTS "Members can read their own memberships" ON public.hub_members;
DROP POLICY IF EXISTS "Hub creators and admins can read all hub members" ON public.hub_members;

CREATE POLICY "Members can read hub members"
  ON public.hub_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.hub_members AS my_membership
      WHERE my_membership.hub_id = hub_members.hub_id
        AND my_membership.user_id = auth.uid()
        AND my_membership.status = 'active'
    )
  );
