# Diagnostic and Fix Guide

You're experiencing issues with:
1. Cannot create spaces
2. Admin button not visible
3. Magic link requires two clicks

Here's how to diagnose and fix these issues step by step.

---

## Quick Fix (Try This First)

### Step 1: Visit the Debug Page

Go to: `https://bullet.chompchomp.cc/debug`

This page will show you:
- Your auth user status
- Your profile status (and whether is_admin exists)
- Your space memberships
- All available spaces

### Step 2: Run FORCE-FIX.sql

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `/supabase/FORCE-FIX.sql`
4. **IMPORTANT**: Replace `'YOUR_EMAIL@EXAMPLE.COM'` with your actual email address
5. Click **Run**
6. Check the output - you should see "AFTER FIX - Your Profile:" with `is_admin: true`

### Step 3: Refresh the Debug Page

Go back to `https://bullet.chompchomp.cc/debug` and refresh. You should now see:
- ✓ Profile exists
- ✓ You are an admin
- Your space memberships (if any exist)

### Step 4: Test Creating a Space

1. Go to `https://bullet.chompchomp.cc/app/spaces`
2. Try creating a new space
3. It should work now!

### Step 5: Check for Admin Button

1. Look at the navigation bar
2. You should see an "Admin" link next to "Sign out"
3. Click it to verify the admin panel works

---

## If Quick Fix Doesn't Work

### Run Full Diagnostics

1. Open Supabase SQL Editor
2. Open the file `/supabase/DIAGNOSE.sql`
3. Run the entire script
4. Copy **all** the output
5. Send it to me so I can analyze what's wrong

The diagnostic script checks:
- All auth users in your database
- Profile table structure
- Profile data
- Orphaned auth users (users without profiles)
- Spaces and memberships
- RLS policies
- Trigger functions

---

## Fix Magic Link Double-Click Issue

See the detailed guide: `/TROUBLESHOOTING-MAGIC-LINKS.md`

**Quick version:**

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to Redirect URLs:
   ```
   https://bullet.chompchomp.cc/app/spaces
   https://bullet.chompchomp.cc/**
   ```
3. Set Site URL to: `https://bullet.chompchomp.cc`
4. Save and test

---

## Understanding the Files

### `/supabase/DIAGNOSE.sql`
- Comprehensive diagnostic script
- Shows everything about your database state
- Run this when you need to understand what's happening
- Safe to run (read-only queries)

### `/supabase/FORCE-FIX.sql`
- Forcefully creates your profile as admin
- Deletes and recreates your profile to fix any corruption
- **Replace the email before running!**
- Use this when SIMPLE-FIX.sql didn't work

### `/supabase/SIMPLE-FIX.sql`
- Gentler fix that doesn't delete anything
- Adds is_admin column if missing
- Sets is_admin = true for your email
- Try this before FORCE-FIX.sql

### `/app/debug/page.tsx`
- Web page that shows your current state
- Visit at `/debug` route
- Shows what the app sees about you
- Helps verify fixes worked

### `/TROUBLESHOOTING-MAGIC-LINKS.md`
- Complete guide to fixing double-click magic link issue
- Explains Supabase redirect URL configuration
- Includes debugging steps

---

## Common Issues and Solutions

### Issue: Profile doesn't exist
**Solution**: Run FORCE-FIX.sql with your email

### Issue: Profile exists but is_admin is false
**Solution**: Run FORCE-FIX.sql with your email

### Issue: Can see spaces but can't create new ones
**Possible causes**:
- RLS policy blocking creation
- Profile missing or corrupted
- Not authenticated properly

**Solution**: Check /debug page, then run FORCE-FIX.sql

### Issue: Admin link not showing
**Causes**:
- is_admin is false or null
- Profile doesn't exist
- Layout component not reading is_admin correctly

**Solution**: Run FORCE-FIX.sql, then check /debug page

### Issue: Magic link requires two clicks
**Cause**: Supabase redirect URLs not configured

**Solution**: Follow TROUBLESHOOTING-MAGIC-LINKS.md

---

## Support Checklist

If you're still having issues, send me:

1. [ ] Screenshot of `/debug` page
2. [ ] Full output from DIAGNOSE.sql
3. [ ] Screenshot of Supabase Authentication → URL Configuration
4. [ ] Any error messages from browser console (F12 → Console)
5. [ ] Confirmation that you ran FORCE-FIX.sql with your actual email

This will help me identify exactly what's wrong and provide a targeted fix.
