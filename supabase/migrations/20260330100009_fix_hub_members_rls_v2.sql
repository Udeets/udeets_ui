-- Fix infinite recursion in hub_members RLS policies.
-- The previous fix still caused recursion because the EXISTS subquery
-- referenced hub_members from within a hub_members policy.
-- Solution: replace all policies with non-recursive ones. Permission
-- logic for admin/creator gating is handled in the application layer.

-- Drop ALL existing policies on hub_members
DROP POLICY IF EXISTS "Members can read their own memberships" ON public.hub_members;
DROP POLICY IF EXISTS "Hub creators and admins can read all hub members" ON public.hub_members;
DROP POLICY IF EXISTS "Members can read hub members" ON public.hub_members;
DROP POLICY IF EXISTS "Authenticated users can insert their own membership" ON public.hub_members;
DROP POLICY IF EXISTS "Hub admins can insert membership rows for others" ON public.hub_members;
DROP POLICY IF EXISTS "Hub admins can update membership rows" ON public.hub_members;

-- Simple non-recursive SELECT: authenticated users can read all rows.
-- Permission logic is enforced in the application layer.
CREATE POLICY "Authenticated users can read hub members"
  ON public.hub_members
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: users can only insert their own membership row
CREATE POLICY "Users can insert own membership"
  ON public.hub_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own membership row
CREATE POLICY "Users can update own membership"
  ON public.hub_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
