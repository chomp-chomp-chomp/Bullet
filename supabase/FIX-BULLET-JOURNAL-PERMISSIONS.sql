-- FIX BULLET JOURNAL PERMISSIONS
-- This script updates daily_pages, bullets, and space_invites policies to use helper functions
-- Run this after applying FIX-SPACES-RECURSION.sql

-- ============================================
-- STEP 1: Ensure helper functions exist
-- ============================================

-- If you haven't run FIX-SPACES-RECURSION.sql yet, uncomment and run these:
/*
CREATE OR REPLACE FUNCTION is_space_member(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = space_uuid
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_space_owner(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.spaces
    WHERE id = space_uuid
      AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ============================================
-- STEP 2: Drop existing daily_pages policies
-- ============================================

DROP POLICY IF EXISTS "Space members can view daily pages" ON daily_pages;
DROP POLICY IF EXISTS "Space members can create daily pages" ON daily_pages;
DROP POLICY IF EXISTS "Page creators and owners can update daily pages" ON daily_pages;
DROP POLICY IF EXISTS "Page creators and owners can delete daily pages" ON daily_pages;

-- ============================================
-- STEP 3: Create new daily_pages policies using helper functions
-- ============================================

CREATE POLICY "Space members can view daily pages"
  ON daily_pages FOR SELECT
  USING (is_space_member(space_id));

CREATE POLICY "Space members can create daily pages"
  ON daily_pages FOR INSERT
  WITH CHECK (
    is_space_member(space_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Page creators and owners can update daily pages"
  ON daily_pages FOR UPDATE
  USING (
    created_by = auth.uid() OR
    is_space_owner(space_id)
  );

CREATE POLICY "Page creators and owners can delete daily pages"
  ON daily_pages FOR DELETE
  USING (
    created_by = auth.uid() OR
    is_space_owner(space_id)
  );

-- ============================================
-- STEP 4: Drop existing bullets policies
-- ============================================

DROP POLICY IF EXISTS "Space members can view non-private bullets" ON bullets;
DROP POLICY IF EXISTS "Space members can create their own bullets" ON bullets;
DROP POLICY IF EXISTS "Bullet creators can update their bullets" ON bullets;
DROP POLICY IF EXISTS "Bullet creators can delete their bullets" ON bullets;

-- ============================================
-- STEP 5: Create new bullets policies using helper functions
-- ============================================

CREATE POLICY "Space members can view non-private bullets"
  ON bullets FOR SELECT
  USING (
    is_space_member(space_id)
    AND (is_private = false OR created_by = auth.uid())
  );

CREATE POLICY "Space members can create their own bullets"
  ON bullets FOR INSERT
  WITH CHECK (
    is_space_member(space_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Bullet creators can update their bullets"
  ON bullets FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Bullet creators can delete their bullets"
  ON bullets FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- STEP 6: Drop existing space_invites policies
-- ============================================

DROP POLICY IF EXISTS "Space owners can view invites for their spaces" ON space_invites;
DROP POLICY IF EXISTS "Invitees can view their pending invites" ON space_invites;
DROP POLICY IF EXISTS "Space owners can create invites" ON space_invites;
DROP POLICY IF EXISTS "Space owners can delete invites" ON space_invites;
DROP POLICY IF EXISTS "Invitees can accept their invites" ON space_invites;

-- ============================================
-- STEP 7: Create new space_invites policies using helper functions
-- ============================================

CREATE POLICY "Space owners can view invites for their spaces"
  ON space_invites FOR SELECT
  USING (is_space_owner(space_id));

CREATE POLICY "Invitees can view their pending invites"
  ON space_invites FOR SELECT
  USING (
    email = auth_email() AND accepted_at IS NULL
  );

CREATE POLICY "Space owners can create invites"
  ON space_invites FOR INSERT
  WITH CHECK (is_space_owner(space_id));

CREATE POLICY "Space owners can delete invites"
  ON space_invites FOR DELETE
  USING (is_space_owner(space_id));

CREATE POLICY "Invitees can accept their invites"
  ON space_invites FOR UPDATE
  USING (email = auth_email() AND accepted_at IS NULL)
  WITH CHECK (email = auth_email());

-- ============================================
-- STEP 8: Verify the fix
-- ============================================

-- Show all policies for verification
SELECT 'Daily pages policies:' as info;
SELECT policyname, cmd as command
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'daily_pages'
ORDER BY policyname;

SELECT 'Bullets policies:' as info;
SELECT policyname, cmd as command
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bullets'
ORDER BY policyname;

SELECT 'Space invites policies:' as info;
SELECT policyname, cmd as command
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'space_invites'
ORDER BY policyname;

-- Test queries to ensure permissions work
SELECT 'Testing daily_pages query...' as test;
SELECT COUNT(*) as page_count FROM daily_pages;

SELECT 'Testing bullets query...' as test;
SELECT COUNT(*) as bullet_count FROM bullets;

SELECT 'Testing space_invites query...' as test;
SELECT COUNT(*) as invite_count FROM space_invites;

SELECT 'Fix applied successfully! Bullet journal should now work correctly.' as status;
