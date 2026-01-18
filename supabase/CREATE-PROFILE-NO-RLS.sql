-- CREATE PROFILE BYPASSING RLS
-- This creates your profile without triggering any RLS policies
-- Run this AFTER running FIX-ALL-RLS.sql

-- ============================================
-- STEP 1: Temporarily disable RLS on profiles table
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Delete any existing broken profile
-- ============================================

DELETE FROM profiles WHERE id = '00f93c80-36b8-4714-96e5-74e47d6b2ec7';

-- ============================================
-- STEP 3: Insert your profile as admin
-- ============================================

INSERT INTO profiles (id, email, display_name, is_admin)
VALUES (
  '00f93c80-36b8-4714-96e5-74e47d6b2ec7',
  'dboman@gmail.com',
  'dboman',
  true
)
ON CONFLICT (id) DO UPDATE
  SET is_admin = true,
      email = 'dboman@gmail.com',
      display_name = 'dboman';

-- ============================================
-- STEP 4: Re-enable RLS on profiles table
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Verify it worked
-- ============================================

SELECT
  'Your profile:' as status,
  id,
  email,
  display_name,
  is_admin,
  created_at
FROM profiles
WHERE id = '00f93c80-36b8-4714-96e5-74e47d6b2ec7';

-- Verify you can query it with RLS enabled (should work now)
SELECT 'Testing with RLS enabled:' as test;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00f93c80-36b8-4714-96e5-74e47d6b2ec7"}';
SELECT id, email, is_admin FROM profiles WHERE id = '00f93c80-36b8-4714-96e5-74e47d6b2ec7';
