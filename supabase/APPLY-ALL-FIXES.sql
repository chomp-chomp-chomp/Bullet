-- ============================================================
-- COMPREHENSIVE FIX FOR SPACE CREATION AND ADMIN ACCESS
-- ============================================================
-- 
-- This script fixes two critical issues:
-- 1. Unable to create spaces (circular RLS policy dependency)
-- 2. Unable to access admin panel (infinite recursion in RLS policies)
--
-- Run this script in your Supabase SQL Editor if you're experiencing these issues.
--
-- ============================================================

-- Fix 1: Create is_admin() function with SECURITY DEFINER
-- This prevents infinite recursion when checking admin status
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Update the "Admins can view all profiles" policy to use the new function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Fix 3: Add policy to allow space creators to view their spaces
-- This fixes the circular dependency when creating spaces
DROP POLICY IF EXISTS "Users can view spaces they created" ON spaces;
CREATE POLICY "Users can view spaces they created"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Run these queries to verify the fixes were applied successfully:

-- Check if is_admin function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- Expected output: One row showing the function with security_type = 'DEFINER'

-- Check if both critical RLS policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies
WHERE tablename IN ('spaces', 'profiles')
  AND policyname IN ('Users can view spaces they created', 'Admins can view all profiles')
ORDER BY tablename, policyname;

-- Expected output: Two rows showing both policies
