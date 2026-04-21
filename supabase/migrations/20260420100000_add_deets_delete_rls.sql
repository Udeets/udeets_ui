-- Allow deleting deets from the client. Without a DELETE policy, Postgres RLS
-- rejects every delete (zero rows removed) while PostgREST still returns 200,
-- so the UI looked deleted until the next full page load.

-- Authors delete their own posts
CREATE POLICY "Authors can delete own deets"
  ON public.deets
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Hub owner (hubs.created_by is text, matching auth user id as string)
CREATE POLICY "Hub creators can delete deets in their hub"
  ON public.deets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.hubs h
      WHERE h.id = deets.hub_id
        AND h.created_by = auth.uid()::text
    )
  );

-- Active hub admins / creators (membership row)
CREATE POLICY "Hub admins can delete deets in their hub"
  ON public.deets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.hub_members hm
      WHERE hm.hub_id = deets.hub_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('creator', 'admin')
        AND hm.status = 'active'
    )
  );
