-- Add image and file attachment support to comments
alter table public.deet_comments
  add column if not exists image_url text,
  add column if not exists attachment_url text,
  add column if not exists attachment_name text;
