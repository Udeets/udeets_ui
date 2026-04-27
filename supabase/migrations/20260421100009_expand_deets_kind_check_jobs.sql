-- Add 'Jobs' to the allowed deets.kind values. The composer's Job Posting
-- flow submits kind = 'Jobs', which the previous CHECK constraint rejected.
-- See useDeetComposer.ts postTypeToKind map: jobs → 'Jobs'.

ALTER TABLE public.deets DROP CONSTRAINT IF EXISTS deets_kind_check;

ALTER TABLE public.deets ADD CONSTRAINT deets_kind_check
  CHECK (kind IN ('Posts', 'Notices', 'Photos', 'News', 'Deals', 'Hazards', 'Alerts', 'Jobs'));
