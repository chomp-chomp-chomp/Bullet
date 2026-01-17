-- Add admin support to existing database
-- Run this AFTER the main schema.sql if you've already set up the database
-- Or run the updated schema.sql if starting fresh

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Make the first user (oldest created_at) an admin
-- Replace 'your-email@example.com' with YOUR actual email address
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';

-- Alternative: Make the first created user an admin automatically
-- Uncomment this if you want the first user to automatically be admin:
-- UPDATE profiles
-- SET is_admin = true
-- WHERE created_at = (SELECT MIN(created_at) FROM profiles);
