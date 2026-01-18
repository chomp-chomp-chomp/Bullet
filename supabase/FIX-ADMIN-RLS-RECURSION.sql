-- FIX ADMIN RLS INFINITE RECURSION
-- This fixes the recursive policy on profiles table that causes infinite recursion
-- when checking admin access

-- Step 1: Create a security definer function to check if user is admin
-- This function bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the problematic "Admins can view all profiles" policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Step 3: Recreate the policy using the security definer function
-- This avoids the infinite recursion by using a function that bypasses RLS
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Step 4: Verify the fix
SELECT 'Fixed admin RLS policy' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles';
