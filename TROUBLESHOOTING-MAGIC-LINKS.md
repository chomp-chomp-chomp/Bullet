# Troubleshooting Magic Link Double-Click Issue

## The Problem
You have to click the magic link twice to log into the app.

## Root Cause
This happens when Supabase redirect URLs are not properly configured for your custom domain `bullet.chompchomp.cc`.

## The Fix

### Step 1: Configure Redirect URLs in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Find the **Redirect URLs** section

### Step 2: Add Your URLs

Add these **exact** URLs to the allowed redirect URLs list:

```
https://bullet.chompchomp.cc/app/spaces
https://bullet.chompchomp.cc/**
```

### Step 3: Update Site URL

In the same URL Configuration section:

1. Find **Site URL**
2. Set it to: `https://bullet.chompchomp.cc`

### Step 4: Verify Email Templates

1. Navigate to **Authentication** → **Email Templates**
2. Click on **Magic Link** template
3. Verify the confirmation link uses: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

### Step 5: Test the Flow

1. Log out completely
2. Go to `https://bullet.chompchomp.cc/login`
3. Enter your email
4. Check your email
5. Click the magic link **once**
6. You should be redirected and logged in immediately

## If It Still Doesn't Work

### Check Your DNS Settings

Make sure `bullet.chompchomp.cc` is properly pointed to your hosting provider (Vercel, etc.):

```bash
dig bullet.chompchomp.cc
```

### Check Your Middleware

The middleware in `/middleware.ts` should be refreshing the session. Verify it's running on all `/app/*` routes.

### Check Browser Console

Open browser DevTools → Console and check for any errors when clicking the magic link.

### Common Errors:

1. **"Invalid redirect URL"** - Your URL is not in the allowed list
2. **"Token expired"** - The link is older than 1 hour (default expiry)
3. **"Invalid token"** - The link was already used

## Alternative: Use Localhost for Testing

If you're still developing, you can use:

```
http://localhost:3000/app/spaces
http://localhost:3000/**
```

Site URL: `http://localhost:3000`

Then test at `http://localhost:3000` instead of the custom domain.

## Why This Happens

Magic links work like this:

1. User requests magic link → Supabase sends email with link
2. User clicks link → Redirects to Supabase auth endpoint
3. Supabase validates token → Redirects to your app with session
4. Your app's middleware creates session cookies → User is logged in

If the redirect URL doesn't match what's configured, Supabase shows an error page with a "Click here to continue" link - that's why you need to click twice.

## Need More Help?

If you're still having issues after following all these steps, run the debug page and send me the output:

1. Go to `https://bullet.chompchomp.cc/debug`
2. Take a screenshot or copy all the output
3. Send it to me along with any error messages from your browser console
