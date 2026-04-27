-- Add hub_members to the supabase_realtime publication so the admin's
-- HubClient.tsx postgres_changes subscription actually fires when a new
-- pending request row is inserted via the /hubs/.../join flow.
-- Without this, admins had to manually refresh to see new requests.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hub_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_members;
  END IF;
END $$;
