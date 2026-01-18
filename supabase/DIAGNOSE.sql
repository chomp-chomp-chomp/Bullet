-- COMPREHENSIVE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose your setup
-- Copy and paste ALL the results back to me

-- ============================================
-- 1. CHECK AUTH USERS
-- ============================================
SELECT
  'AUTH USERS' as check_type,
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at;

-- ============================================
-- 2. CHECK PROFILES TABLE STRUCTURE
-- ============================================
SELECT
  'PROFILES TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK PROFILES DATA
-- ============================================
SELECT
  'PROFILES DATA' as check_type,
  id,
  email,
  display_name,
  is_admin,
  created_at
FROM profiles
ORDER BY created_at;

-- ============================================
-- 4. CHECK FOR ORPHANED AUTH USERS
-- ============================================
SELECT
  'ORPHANED AUTH USERS (no profile)' as check_type,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ============================================
-- 5. CHECK SPACES TABLE
-- ============================================
SELECT
  'SPACES TABLE' as check_type,
  COUNT(*) as total_spaces
FROM spaces;

-- ============================================
-- 6. CHECK SPACE_MEMBERS TABLE
-- ============================================
SELECT
  'SPACE_MEMBERS TABLE' as check_type,
  COUNT(*) as total_memberships
FROM space_members;

-- ============================================
-- 7. CHECK RLS POLICIES ON PROFILES
-- ============================================
SELECT
  'RLS POLICIES - PROFILES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- 8. CHECK RLS POLICIES ON SPACES
-- ============================================
SELECT
  'RLS POLICIES - SPACES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'spaces';

-- ============================================
-- 9. CHECK IF RLS IS ENABLED
-- ============================================
SELECT
  'RLS ENABLED STATUS' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'spaces', 'space_members', 'bullets', 'invites');

-- ============================================
-- 10. CHECK TRIGGER FUNCTION
-- ============================================
SELECT
  'TRIGGER FUNCTION' as check_type,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';
