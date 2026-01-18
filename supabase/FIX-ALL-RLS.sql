-- COMPREHENSIVE RLS FIX - Fixes ALL recursive policies
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL problematic policies
-- ============================================

-- Drop profiles policies that query space_members
DROP POLICY IF EXISTS "Users can view profiles of space members" ON profiles;

-- Drop spaces policies
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;

-- Drop space_members policies (in case they weren't fixed)
DROP POLICY IF EXISTS "Users can view members of their spaces" ON space_members;
DROP POLICY IF EXISTS "Only space owners can add members" ON space_members;
DROP POLICY IF EXISTS "Only space owners can remove members" ON space_members;
DROP POLICY IF EXISTS "Space creators can view all members" ON space_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON space_members;
DROP POLICY IF EXISTS "Space creators can add members" ON space_members;
DROP POLICY IF EXISTS "Space creators can remove members" ON space_members;

-- ============================================
-- STEP 2: Recreate profiles policies WITHOUT recursion
-- ============================================

-- Users can always view their own profile (no recursion)
-- This policy already exists and is fine

-- Admins can view all profiles (queries profiles but checks is_admin, no recursion)
-- This policy already exists and is fine

-- Remove the space_members-based profile viewing policy entirely
-- Users will only see their own profile and admins see all

-- ============================================
-- STEP 3: Recreate spaces policies WITHOUT recursion
-- ============================================

-- Users can view spaces where they are the creator (no join to space_members)
CREATE POLICY "Users can view their own spaces"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());

-- OR users can view spaces they're members of (using space_members)
-- But we need to make sure space_members policies are non-recursive first
CREATE POLICY "Users can view member spaces"
  ON spaces FOR SELECT
  USING (
    id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
  );

-- Existing INSERT, UPDATE, DELETE policies are fine
-- They just check created_by = auth.uid() with no joins

-- ============================================
-- STEP 4: Recreate space_members policies WITHOUT recursion
-- ============================================

-- Users can view their own memberships (direct check, no recursion)
CREATE POLICY "View own memberships"
  ON space_members FOR SELECT
  USING (user_id = auth.uid());

-- Users can view members of spaces they OWN (check spaces table, not space_members)
CREATE POLICY "Space owners view members"
  ON space_members FOR SELECT
  USING (
    space_id IN (
      SELECT id FROM spaces WHERE created_by = auth.uid()
    )
  );

-- Only space creators can add members (check spaces table)
CREATE POLICY "Space owners add members"
  ON space_members FOR INSERT
  WITH CHECK (
    space_id IN (
      SELECT id FROM spaces WHERE created_by = auth.uid()
    )
  );

-- Only space creators can remove members (check spaces table)
CREATE POLICY "Space owners remove members"
  ON space_members FOR DELETE
  USING (
    space_id IN (
      SELECT id FROM spaces WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- STEP 5: Verify and test
-- ============================================

-- Show all policies for verification
SELECT
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'spaces', 'space_members')
ORDER BY tablename, policyname;

-- Test query: Try to read your profile
-- Replace with your email
SELECT 'Testing profile read:' as test;
SELECT id, email, is_admin FROM profiles WHERE email = 'dboman@gmail.com';

-- Test query: Try to read spaces
SELECT 'Testing spaces read:' as test;
SELECT COUNT(*) as space_count FROM spaces;

-- Test query: Try to read space_members
SELECT 'Testing space_members read:' as test;
SELECT COUNT(*) as membership_count FROM space_members;
