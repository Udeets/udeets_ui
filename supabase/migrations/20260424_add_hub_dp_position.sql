-- Add a vertical position (0–100 percent) for the hub DP/logo image so admins
-- can fine-tune the crop on non-square logos. Mirrors cover_image_offset_y.
-- 50 is the default (center-cropped), matching CSS's default `object-position`.

alter table public.hubs
  add column if not exists dp_image_offset_y numeric(5,2) not null default 50.00
  check (dp_image_offset_y >= 0 and dp_image_offset_y <= 100);
