# Fix for Spaces and Space Members Infinite Recursion

## Problem
When querying the `spaces` or `space_members` tables, users encounter:
```
Error: infinite recursion detected in policy for relation "spaces"
Error: infinite recursion detected in policy for relation "space_members"
```

Error code: `42P17`

## Root Cause
The issue is caused by a **circular dependency** in Row Level Security (RLS) policies between the `spaces` and `space_members` tables:

### The Recursion Loop:
1. **Query spaces table** → RLS policy "Users can view member spaces" checks if user is a member
2. **Queries space_members table** → To verify membership, it needs to check space_members
3. **RLS on space_members** → Policy "Space owners can view members" checks if user owns the space
4. **Queries spaces table again** → This creates infinite recursion back to step 1

### Visual Representation:
```
spaces policy → SELECT from space_members
                    ↓
    space_members RLS checks → SELECT from spaces
                    ↓
              spaces RLS checks → SELECT from space_members
                    ↓
                  ♾️ INFINITE RECURSION
```

## Solution
Use PostgreSQL functions with `SECURITY DEFINER` privilege that bypass RLS when checking permissions:

### 1. Helper Functions
```sql
-- Check if user is a space member (bypasses RLS)
CREATE OR REPLACE FUNCTION is_space_member(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = space_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns a space (bypasses RLS)
CREATE OR REPLACE FUNCTION is_space_owner(space_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.spaces
    WHERE id = space_uuid AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Updated Policies
Instead of policies that query tables (which trigger RLS), use the helper functions:

**Before (causes recursion):**
```sql
-- This queries space_members, which triggers RLS on space_members
CREATE POLICY "Users can view member spaces"
  ON spaces FOR SELECT
  USING (
    id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
  );
```

**After (no recursion):**
```sql
-- This calls a SECURITY DEFINER function that bypasses RLS
CREATE POLICY "Users can view member spaces"
  ON spaces FOR SELECT
  USING (is_space_member(id));
```

## How to Apply the Fix

### Option 1: Run the Fix Script (Recommended)
1. Go to your Supabase Dashboard → SQL Editor
2. Open the file `/supabase/FIX-SPACES-RECURSION.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click "Run"
5. Verify the output shows "Fix applied successfully!"

### Option 2: Manual Application
If you prefer to apply manually, the script does the following:

1. **Creates helper functions** (`is_space_member` and `is_space_owner`)
2. **Drops all existing policies** on `spaces` and `space_members` tables
3. **Recreates policies** using the helper functions

### Option 3: Fresh Database Setup
For new deployments or if you're setting up the database from scratch:
1. Use the updated `/supabase/schema.sql` file
2. It now includes the helper functions and non-recursive policies
3. No additional steps needed!

## Verification
After applying the fix, test that queries work without recursion:

```sql
-- These should work without errors:
SELECT COUNT(*) FROM spaces;
SELECT COUNT(*) FROM space_members;

-- Try to access a space you're a member of:
SELECT * FROM spaces WHERE id = '<space_id>';

-- View members of a space you own:
SELECT * FROM space_members WHERE space_id = '<space_id>';
```

All queries should execute successfully without "infinite recursion" errors.

## Technical Details

### Why SECURITY DEFINER Works
- `SECURITY DEFINER` makes the function execute with the privileges of the function **owner** (usually the database superuser)
- This means the function bypasses RLS policies when executing
- The function still checks `auth.uid()` to ensure security - it just doesn't trigger RLS recursion
- This is safe because the function logic is controlled and doesn't expose unauthorized data

### What Changed
| Table | Old Policy Approach | New Policy Approach |
|-------|-------------------|-------------------|
| `spaces` | Queried `space_members` table directly | Uses `is_space_member()` function |
| `space_members` | Queried `spaces` table directly | Uses `is_space_owner()` function |

## Impact on Functionality
✅ **No change to application behavior** - All security rules remain the same
✅ **Same access control** - Users can only see what they're authorized to see
✅ **Better performance** - Functions with SECURITY DEFINER can be more efficient
✅ **No recursion errors** - The circular dependency is eliminated

## For Future Development
When creating new RLS policies:
1. **Avoid circular dependencies** between tables
2. **Use SECURITY DEFINER functions** for cross-table permission checks
3. **Test thoroughly** with different user roles
4. **Monitor for recursion errors** during development

## Troubleshooting

### If the fix doesn't work:
1. Check that functions were created successfully:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('is_space_member', 'is_space_owner');
   ```

2. Verify policies are using the functions:
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('spaces', 'space_members')
   ORDER BY tablename, policyname;
   ```

3. Check for any remaining old policies that might conflict

### If you still see recursion errors:
- Ensure you ran the complete fix script
- Check for any custom policies that might be querying across tables
- Verify that RLS is enabled on both tables: `ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;`

## Related Issues
- Similar fix was applied for admin profile access (see `/supabase/README-ADMIN-FIX.md`)
- The same SECURITY DEFINER pattern can be used for other recursive policy issues
