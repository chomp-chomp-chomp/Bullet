-- FIX RLS INFINITE RECURSION
-- This fixes the recursive policy on space_members table

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their spaces" ON space_members;
DROP POLICY IF EXISTS "Only space owners can add members" ON space_members;
DROP POLICY IF EXISTS "Only space owners can remove members" ON space_members;

-- Step 2: Create fixed policies that don't cause recursion

-- Allow users to view space_members if they created the space
CREATE POLICY "Space creators can view all members"
  ON space_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

-- Allow users to view their own membership records
CREATE POLICY "Users can view their own memberships"
  ON space_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow space creators to add members
CREATE POLICY "Space creators can add members"
  ON space_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

-- Allow space creators to remove members
CREATE POLICY "Space creators can remove members"
  ON space_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

-- Verify the fix worked
SELECT 'Fixed policies for space_members:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'space_members';
