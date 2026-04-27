-- Add a vertical position (0–100 percent) for the cover image so admins can
-- drag to reveal the right portion of a tall or off-centered photo. 50 is the
-- default (center-cropped), which matches CSS's default `object-position: center`.

alter table public.hubs
  add column if not exists cover_image_offset_y numeric(5,2) not null default 50.00
  check (cover_image_offset_y >= 0 and cover_image_offset_y <= 100);
