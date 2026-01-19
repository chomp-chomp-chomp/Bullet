-- FIX INFINITE RECURSION IN SPACES AND SPACE_MEMBERS POLICIES
-- This script resolves the circular dependency between spaces and space_members RLS policies

-- ============================================
-- STEP 1: Create Helper Functions with SECURITY DEFINER
-- ============================================

-- Helper function to check if current user is a member of a space
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION is_space_member(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = space_uuid
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user owns/created a space
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION is_space_owner(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.spaces
    WHERE id = space_uuid
      AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Drop ALL existing policies on spaces table
-- ============================================

DROP POLICY IF EXISTS "Users can view spaces they created" ON spaces;
DROP POLICY IF EXISTS "Users can view member spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view their own spaces" ON spaces;
DROP POLICY IF EXISTS "Authenticated users can create spaces" ON spaces;
DROP POLICY IF EXISTS "Only space owners can update spaces" ON spaces;
DROP POLICY IF EXISTS "Only space owners can delete spaces" ON spaces;

-- ============================================
-- STEP 3: Drop ALL existing policies on space_members table
-- ============================================

DROP POLICY IF EXISTS "Space creators can view all members" ON space_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON space_members;
DROP POLICY IF EXISTS "Space creators can add members" ON space_members;
DROP POLICY IF EXISTS "Space creators can remove members" ON space_members;
DROP POLICY IF EXISTS "View own memberships" ON space_members;
DROP POLICY IF EXISTS "Space owners view members" ON space_members;
DROP POLICY IF EXISTS "Space owners add members" ON space_members;
DROP POLICY IF EXISTS "Space owners remove members" ON space_members;

-- ============================================
-- STEP 4: Create new NON-RECURSIVE policies for spaces table
-- ============================================

-- Users can view spaces they created (no recursion - direct check)
CREATE POLICY "Users can view spaces they created"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());

-- Users can view spaces they are members of (uses helper function to avoid recursion)
CREATE POLICY "Users can view member spaces"
  ON spaces FOR SELECT
  USING (is_space_member(id));

-- Authenticated users can create spaces (no recursion)
CREATE POLICY "Authenticated users can create spaces"
  ON spaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only space owners can update spaces (no recursion - direct check)
CREATE POLICY "Only space owners can update spaces"
  ON spaces FOR UPDATE
  USING (created_by = auth.uid());

-- Only space owners can delete spaces (no recursion - direct check)
CREATE POLICY "Only space owners can delete spaces"
  ON spaces FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- STEP 5: Create new NON-RECURSIVE policies for space_members table
-- ============================================

-- Users can view their own memberships (no recursion - direct check)
CREATE POLICY "Users can view their own memberships"
  ON space_members FOR SELECT
  USING (user_id = auth.uid());

-- Space owners can view all members (uses helper function to avoid recursion)
CREATE POLICY "Space owners can view members"
  ON space_members FOR SELECT
  USING (is_space_owner(space_id));

-- Space owners can add members (uses helper function to avoid recursion)
CREATE POLICY "Space owners can add members"
  ON space_members FOR INSERT
  WITH CHECK (is_space_owner(space_id));

-- Space owners can remove members (uses helper function to avoid recursion)
CREATE POLICY "Space owners can remove members"
  ON space_members FOR DELETE
  USING (is_space_owner(space_id));

-- ============================================
-- STEP 6: Verify the fix
-- ============================================

-- Show all policies for verification
SELECT
  'Spaces policies:' as info,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'spaces'
ORDER BY policyname;

SELECT
  'Space members policies:' as info,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'space_members'
ORDER BY policyname;

-- Test queries to ensure no recursion
SELECT 'Testing spaces query...' as test;
SELECT COUNT(*) as space_count FROM spaces;

SELECT 'Testing space_members query...' as test;
SELECT COUNT(*) as member_count FROM space_members;

SELECT 'Fix applied successfully! No infinite recursion should occur.' as status;
