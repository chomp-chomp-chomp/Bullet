# Troubleshooting Steps

## Issue 1: Make Yourself Admin

You need to set yourself as admin in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (replace with YOUR email):

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'your-actual-email@example.com';
```

3. Refresh your app - you should see the Admin link

---

## Issue 2: Magic Link Requires Two Clicks

This is a redirect URL issue. Fix it:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to: `https://bullet.chompchomp.cc`
3. Under **Redirect URLs**, add:
   - `https://bullet.chompchomp.cc/**`
   - `https://bullet.chompchomp.cc/app/spaces`
   - `http://localhost:3000/**`
4. Click Save

---

## Issue 3: Can't Create Spaces

Check if you have the profile created:

1. Go to Supabase → Table Editor → profiles
2. Do you see your user there?
3. If not, the trigger might not have fired

Run this SQL to check:
```sql
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

If no profile exists, create one manually:
```sql
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT id, email, split_part(email, '@', 1), true
FROM auth.users
WHERE email = 'your-email@example.com';
```

---

## Issue 4: Check RLS Policies

Make sure RLS policies are set up correctly. Run the entire schema.sql again if needed.

