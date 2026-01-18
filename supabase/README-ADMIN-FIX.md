# Fix for Admin Access Denied - Infinite Recursion Error

## Problem
When accessing the admin page (`/app/admin`), users see:
```
Access Denied
Error: Your profile does not exist (infinite recursion detected in policy for relation "space_members")
```

This occurs even when the user is correctly set as an admin in the database.

## Root Cause
The issue is caused by a circular dependency in Row Level Security (RLS) policies:

1. The "Admins can view all profiles" policy tries to verify if the current user is an admin
2. To do this, it queries the `profiles` table: `SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true`
3. This SELECT query must itself pass through RLS policies on the `profiles` table
4. One of those policies is the "Admins can view all profiles" policy
5. This creates infinite recursion

## Solution
Create a PostgreSQL function with `SECURITY DEFINER` that bypasses RLS when checking admin status:

```sql
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then update the policy to use this function:
```sql
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());
```

## How to Apply the Fix

### Option 1: Run the Fix Script (Recommended)
1. Go to your Supabase Dashboard → SQL Editor
2. Open the file `/supabase/FIX-ADMIN-RLS-RECURSION.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click "Run"
5. Refresh your admin page

### Option 2: Manual Fix
1. Go to your Supabase Dashboard → SQL Editor
2. Run the following SQL:
```sql
-- Create the security definer function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());
```

## Verification
After applying the fix:
1. Go to `/app/admin` - you should now see the admin panel
2. You should see a list of all users
3. No "infinite recursion" error should appear

## For New Deployments
The fix is now included in `/supabase/schema.sql`, so new deployments will not encounter this issue.
