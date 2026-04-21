-- Fix infinite recursion in profiles RLS policies.
-- The "Super admins can read/update all profiles" policies query
-- public.profiles inside their USING clause, which re-triggers
-- the same RLS evaluation → infinite loop.
--
-- Solution: create a SECURITY DEFINER function that bypasses RLS
-- to check the caller's app_role, then reference that function
-- in the policies instead of a direct sub-select.

-- Step 1: Create a helper that runs with elevated privileges
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND app_role = 'super_admin'
  );
$$;

-- Step 2: Drop the two recursive policies
DROP POLICY IF EXISTS "Super admins can read all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update app_role"     ON public.profiles;

-- Step 3: Recreate them using the safe helper
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  );

CREATE POLICY "Super admins can update app_role"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_super_admin()
  );
