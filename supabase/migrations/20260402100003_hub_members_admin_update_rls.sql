-- Allow hub creators and admins to update membership rows for their hubs.
-- This enables the approve/reject flow for pending join requests.
-- The original UPDATE policy only allows users to update their own row.
-- We add a second policy that allows updates if the current user is a
-- creator or admin of the same hub (verified via a subquery on a
-- DIFFERENT table — hubs.created_by — to avoid RLS recursion).

-- Policy: hub creator can update any membership in their hub
CREATE POLICY "Hub creator can update members"
  ON public.hub_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hubs
      WHERE hubs.id = hub_members.hub_id
        AND hubs.created_by = auth.uid()::text
    )
  );
