-- Allow super admins to read all profiles (for the admin user list)
-- Normal users can only read their own profile
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.app_role = 'super_admin'
    )
  );

-- Allow super admins to update app_role on any profile
CREATE POLICY "Super admins can update app_role"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.app_role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.app_role = 'super_admin'
    )
  );
