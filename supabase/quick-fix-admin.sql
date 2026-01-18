-- Quick Fix: Add is_admin column and make yourself admin
-- Run this in Supabase SQL Editor

-- Step 1: Add the is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Step 2: Make yourself admin (you must be logged in when running this)
UPDATE profiles
SET is_admin = true
WHERE id = auth.uid();

-- Step 3: Verify it worked - you should see your profile with is_admin = true
SELECT id, email, display_name, is_admin
FROM profiles
WHERE id = auth.uid();

-- Step 4: If you don't have a profile at all, create it
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  split_part((SELECT email FROM auth.users WHERE id = auth.uid()), '@', 1),
  true
ON CONFLICT (id) DO UPDATE
SET is_admin = true;

-- Step 5: Update the trigger to make first user admin automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Check if this is the first user
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

-- Done! Refresh your app and you should see the Admin link
