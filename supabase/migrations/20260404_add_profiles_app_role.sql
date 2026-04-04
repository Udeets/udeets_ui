-- Add platform-level role column to profiles table.
-- Default is 'user'; super admins get 'super_admin'.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_role text NOT NULL DEFAULT 'user';

-- Index for quick super-admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON public.profiles (app_role)
  WHERE app_role <> 'user';

-- RLS: users can read their own app_role (already covered by existing profile policies).
-- Only super admins or service-role can update app_role; enforced at app level for now.
