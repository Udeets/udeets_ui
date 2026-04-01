-- Add JSONB preference columns to profiles table for settings page.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  notification_preferences JSONB DEFAULT '{"push_new_posts": true, "weekly_digest": true, "event_reminders": false}';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  privacy_settings JSONB DEFAULT '{"show_profile": true, "allow_invites": false}';
