-- Add accent_color column to hubs table for admin-selected color themes
alter table public.hubs
  add column if not exists accent_color text default null;

comment on column public.hubs.accent_color is 'Preset accent color key chosen by hub admin (e.g. teal, blue, purple, coral, gold, slate)';
