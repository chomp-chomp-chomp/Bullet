-- SUPER SIMPLE FIX - Just replace YOUR_EMAIL with your actual email
-- Run this in Supabase SQL Editor

-- Step 1: Add is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Step 2: Make yourself admin - REPLACE 'YOUR_EMAIL@EXAMPLE.COM' with your actual email
UPDATE profiles
SET is_admin = true
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';

-- Step 3: If you don't have a profile yet, create one
-- REPLACE 'YOUR_EMAIL@EXAMPLE.COM' with your actual email
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT
  id,
  email,
  split_part(email, '@', 1),
  true
FROM auth.users
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM'
ON CONFLICT (id) DO UPDATE
SET is_admin = true;

-- Step 4: Verify it worked - you should see your profile with is_admin = true
SELECT id, email, display_name, is_admin
FROM profiles
ORDER BY created_at;

-- Step 5: Update the trigger for future users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  INSERT INTO public.profiles (id, email, display_name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    is_first_user
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
