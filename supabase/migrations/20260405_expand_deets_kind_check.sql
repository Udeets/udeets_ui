-- Expand the allowed values for deets.kind to support all post types.
-- The original constraint only allowed Posts, Notices, Photos.
-- The app now supports News, Deals, Hazards, and Alerts as well.

ALTER TABLE public.deets DROP CONSTRAINT IF EXISTS deets_kind_check;

ALTER TABLE public.deets ADD CONSTRAINT deets_kind_check
  CHECK (kind IN ('Posts', 'Notices', 'Photos', 'News', 'Deals', 'Hazards', 'Alerts'));
