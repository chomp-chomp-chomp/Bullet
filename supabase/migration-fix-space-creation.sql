-- Migration: Fix Space Creation Issue
-- Date: 2026-01-18
-- Description: Add RLS policy to allow space creators to view their spaces before being added to space_members
-- This fixes the circular dependency that prevented space creation from working

-- Add new SELECT policy for spaces table
-- This allows users to see spaces they created, even if they're not yet in space_members
CREATE POLICY IF NOT EXISTS "Users can view spaces they created"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());

-- Verify the policy was created successfully
-- Expected output: One row showing the new policy details with policyname = 'Users can view spaces they created'
-- If the query returns no rows, the policy creation may have failed
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'spaces' AND policyname = 'Users can view spaces they created';
