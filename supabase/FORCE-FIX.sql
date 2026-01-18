-- FORCE FIX SCRIPT
-- This will absolutely ensure your profile exists and you are admin
-- REPLACE 'YOUR_EMAIL@EXAMPLE.COM' with your actual email address

-- Step 1: First, let's see what we have
SELECT 'BEFORE FIX - Auth Users:' as status, id, email FROM auth.users;
SELECT 'BEFORE FIX - Profiles:' as status, id, email, is_admin FROM profiles;

-- Step 2: Ensure is_admin column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Step 3: Delete any broken profile for your email (if exists)
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@EXAMPLE.COM'
);

-- Step 4: Insert fresh profile with admin = true
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT
  id,
  email,
  split_part(email, '@', 1),
  true
FROM auth.users
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';

-- Step 5: Double-check it worked
SELECT 'AFTER FIX - Your Profile:' as status, id, email, display_name, is_admin, created_at
FROM profiles
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';

-- Step 6: Also make sure you're a member of any existing spaces
INSERT INTO space_members (space_id, user_id, role)
SELECT
  s.id as space_id,
  p.id as user_id,
  'owner' as role
FROM spaces s
CROSS JOIN profiles p
WHERE p.email = 'YOUR_EMAIL@EXAMPLE.COM'
  AND NOT EXISTS (
    SELECT 1 FROM space_members sm
    WHERE sm.space_id = s.id AND sm.user_id = p.id
  );

-- Step 7: Final verification
SELECT 'FINAL CHECK - Your Memberships:' as status,
  s.name as space_name,
  sm.role
FROM space_members sm
JOIN spaces s ON s.id = sm.space_id
JOIN profiles p ON p.id = sm.user_id
WHERE p.email = 'YOUR_EMAIL@EXAMPLE.COM';
