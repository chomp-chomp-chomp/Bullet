# Space Creation Fix

## Problem

Users were unable to create spaces, receiving an "unable to create space" error.

## Root Cause

The issue was caused by a **circular RLS (Row Level Security) policy dependency**:

1. When a space is created, the `createSpace` action performs two operations:
   - Insert a new space into the `spaces` table ✓ (this succeeds)
   - Insert the creator as owner into the `space_members` table ✗ (this fails)

2. The `space_members` INSERT policy requires checking if the space exists and if the user is the creator:
   ```sql
   EXISTS (
     SELECT 1 FROM spaces
     WHERE spaces.id = space_members.space_id
       AND spaces.created_by = auth.uid()
   )
   ```

3. However, the `spaces` SELECT policy only allows viewing spaces where the user is already a member:
   ```sql
   EXISTS (
     SELECT 1 FROM space_members
     WHERE space_members.space_id = spaces.id
       AND space_members.user_id = auth.uid()
   )
   ```

4. This creates a catch-22:
   - The newly created space can't be seen by the creator (they're not yet in `space_members`)
   - Therefore, the INSERT into `space_members` fails because the policy check can't verify the space exists
   - Result: Space is created but orphaned, and user gets an error

## Solution

Added a new RLS policy to allow space creators to view spaces they created, even before being added to `space_members`:

```sql
CREATE POLICY "Users can view spaces they created"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());
```

This allows the `space_members` INSERT policy to succeed when adding the creator as the first member.

## Changes Made

### 1. Database Schema (`supabase/schema.sql`)

Added new RLS policy after the existing "Users can view spaces they are members of" policy:

```sql
CREATE POLICY "Users can view spaces they created"
  ON spaces FOR SELECT
  USING (created_by = auth.uid());
```

### 2. Error Handling (`app/app/spaces/CreateSpaceForm.tsx`)

Improved error messages to show actual error details instead of generic message:

```typescript
catch (error) {
  console.error("Failed to create space:", error);
  const errorMessage = error instanceof Error ? error.message : "Failed to create space";
  alert(`Unable to create space: ${errorMessage}`);
}
```

## How to Apply the Fix

### For Existing Deployments

If you have an existing Supabase database, you need to add the new RLS policy:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
CREATE POLICY "Users can view spaces they created"
  ON public.spaces FOR SELECT
  USING (created_by = auth.uid());
```

4. Test by creating a new space in your application

### For New Deployments

The updated `supabase/schema.sql` includes the fix, so new deployments will work automatically.

## Testing

After applying the fix:

1. Log into your application
2. Navigate to the Spaces page
3. Try creating a new space
4. Verify the space is created successfully and you're redirected to it
5. Check that you can see the space in your spaces list

## Technical Notes

- The fix is minimal and surgical - only one new policy line added
- No data migration required
- No breaking changes to existing functionality
- The policy is efficient and doesn't impact performance
- Both RLS policies on spaces can coexist (users see spaces they're members of OR spaces they created)
