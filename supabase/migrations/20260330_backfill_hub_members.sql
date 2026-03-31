-- One-time backfill: insert a creator row into hub_members for every hub
-- that was created before the creator-insert trigger/code was added.

INSERT INTO public.hub_members (hub_id, user_id, role, status, joined_at)
SELECT
  h.id          AS hub_id,
  CAST(h.created_by AS uuid)  AS user_id,
  'creator'     AS role,
  'active'      AS status,
  h.created_at  AS joined_at
FROM public.hubs h
WHERE NOT EXISTS (
  SELECT 1
  FROM public.hub_members hm
  WHERE hm.hub_id = h.id
    AND hm.role = 'creator'
)
ON CONFLICT (hub_id, user_id) DO NOTHING;
