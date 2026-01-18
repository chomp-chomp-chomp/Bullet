-- Complete Fix Script
-- Run this in Supabase SQL Editor to fix all issues

-- STEP 1: Check if you have a profile
-- If this returns nothing, you need to create one
SELECT id, email, display_name, is_admin
FROM profiles
WHERE id = auth.uid();

-- STEP 2: Create your profile if it doesn't exist
-- This will create a profile for the currently logged-in user
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  split_part((SELECT email FROM auth.users WHERE id = auth.uid()), '@', 1),
  true  -- Make yourself admin
ON CONFLICT (id) DO UPDATE
SET is_admin = true;  -- If profile exists, just make yourself admin

-- STEP 3: Verify it worked
SELECT id, email, display_name, is_admin
FROM profiles
WHERE id = auth.uid();

-- You should see your profile with is_admin = true

-- STEP 4: If you still have issues, check RLS policies
-- Run this to see if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should show rowsecurity = true
