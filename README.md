# Bullet Journal Web App

A minimal shared bullet journal web app built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚨 Important: Fix for Existing Deployments

**Are you unable to create spaces or access the admin panel?**

👉 **[Quick Fix Guide](QUICK-FIX.md)** - Takes 2 minutes to fix in Supabase

Common errors this fixes:
- "Unable to create space" - Server Components render error
- "Access Denied - infinite recursion detected" when accessing `/app/admin`

Run the SQL fix script in `supabase/APPLY-ALL-FIXES.sql` to resolve these issues.

## Features

- **Spaces**: Create shared workspaces for teams
- **Today View**: Quick task entry and management for each space
- **Email Invites**: Invite members via email
- **Task Management**:
  - Quick add with keyboard shortcut (press `/`)
  - Toggle task completion with one click
  - Assign tasks to space members
  - Mark tasks as private
  - Cancel or delete tasks
  - Show/hide completed tasks
- **Authentication**: Magic link email authentication via Supabase Auth
- **Real-time**: All data synced via Supabase with Row Level Security (RLS)

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Data Fetching**: Server Components, Server Actions
- **Libraries**:
  - `@supabase/supabase-js` - Supabase client
  - `@supabase/ssr` - Next.js SSR helpers

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up

### 3. Run the Schema

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL in the editor
4. This will create all tables, RLS policies, triggers, and indexes

### 4. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (starts with `eyJ...`)

### 5. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

The easiest way to deploy this app for public access is using Vercel, which is optimized for Next.js applications and offers a generous free tier.

### Prerequisites

- A GitHub account with this repository
- A Supabase project (see Setup Instructions above)
- Your Supabase credentials (URL and Anon Key)

### Step-by-Step Deployment

#### 1. Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

#### 2. Import Your Repository

1. From the Vercel dashboard, click "Add New Project"
2. Find and select your `Bullet` repository
3. Click "Import"

#### 3. Configure Your Project

**Framework Preset**: Vercel should auto-detect Next.js (no changes needed)

**Root Directory**: Leave as `.` (root)

**Build Settings**: Use defaults
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 4. Add Environment Variables

Before deploying, add your Supabase credentials:

1. Click "Environment Variables" section
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...your-anon-key` | Production, Preview, Development |

**Important**:
- Replace the values with your actual Supabase credentials from your Supabase dashboard (Settings > API)
- Make sure to select all environments (Production, Preview, Development)

#### 5. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. Once done, you'll see a success screen with your live URL

#### 6. Configure Supabase Redirects

After deployment, update your Supabase authentication settings:

1. Go to your Supabase dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
4. Add to "Redirect URLs":
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/**` (for local development)

### Accessing Your Deployed App

Your app will be live at: `https://your-project-name.vercel.app`

Users can now:
1. Visit your Vercel URL
2. Enter their email to receive a magic link
3. Click the magic link to authenticate
4. Start creating spaces and managing tasks

### Automatic Deployments

Vercel automatically deploys when you push to your GitHub repository:

- **Production**: Pushes to your main/master branch
- **Preview**: Pull requests and other branches

Every commit creates a deployment preview, perfect for testing changes before merging.

### Managing Your Deployment

**View Logs**:
- Go to your project in Vercel dashboard
- Click "Deployments" tab
- Click any deployment to see logs

**Update Environment Variables**:
- Go to Settings > Environment Variables
- Edit or add new variables
- Redeploy for changes to take effect

**Custom Domain** (Optional):
1. Go to Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Troubleshooting Deployment

**Build Fails**:
- Check the build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors: `npm run build` locally

**Authentication Issues**:
- Verify Supabase environment variables are correct
- Check that redirect URLs are configured in Supabase
- Ensure Site URL matches your Vercel domain

**Database Connection Issues**:
- Verify you ran the `supabase/schema.sql` in your Supabase project
- Check RLS policies are enabled on all tables
- Test database connection in Supabase dashboard

## User Management & Admin Panel

The app includes a built-in admin panel for managing user access. By default, Supabase allows anyone to sign up, but you'll want to control who has access.

### Disable Public Signups (Recommended)

**Do this immediately after deploying:**

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Providers**
3. Click on **"Email"**
4. **Uncheck "Enable email signup"** (keep "Enable email login" checked)
5. Click **Save**

Now only you can invite new users - no one can self-register!

### Accessing the Admin Panel

1. Log in to your app
2. Click **"Admin"** in the top navigation bar
3. You'll see the admin panel at `/app/admin`

### Inviting New Users

**Method 1: Via Admin Panel (Easiest)**

1. Go to **Admin Panel** (`/app/admin`)
2. Enter the user's email address
3. Click **"Send Invitation"**
4. The user receives a magic link via email
5. They click the link and are automatically logged in

**Method 2: Via Supabase Dashboard**

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Invite user"**
3. Enter their email
4. They'll receive a magic link from Supabase

### Managing Users

In the Admin Panel, you can:

- **View all users** with their email, display name, and join date
- **Remove users** (except yourself)
- **See who's been invited** recently

### Optional: Use Resend for Better Emails

Supabase's built-in emails work but may land in spam. For production, use Resend for reliable delivery.

#### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month, 100/day)
3. Verify your email

#### Step 2: Get Your API Key

1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it "Bullet Journal"
4. Copy the API key (starts with `re_`)

#### Step 3: Set Up Your Domain (Optional but Recommended)

**For verified domain (better deliverability):**

1. In Resend, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `chompchomp.cc`
4. Add the DNS records Resend provides
5. Wait for verification (usually ~10 minutes)

**For testing (no domain setup):**

You can use `onboarding@resend.dev` as the sender, but emails may be limited.

#### Step 4: Add Environment Variables

**In Vercel:**

1. Go to **Settings → Environment Variables**
2. Add these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_123abc...` |
| `RESEND_FROM_EMAIL` | Your sender email | `Bullet Journal <noreply@chompchomp.cc>` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://bullet.chompchomp.cc` |

3. Click **"Save"**
4. Redeploy your app

**Locally (for testing):**

Add to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Bullet Journal <noreply@chompchomp.cc>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 5: Configure Supabase to Disable Emails (Optional)

If you want to use ONLY Resend for emails:

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. Disable **"Enable email confirmations"**

**Note:** The current implementation uses Supabase's magic links. To fully switch to Resend, you'd need to implement custom token generation, which is beyond this basic setup.

### How Email Invitations Work

1. **Admin invites user** via the Admin Panel
2. **Supabase generates** a magic link
3. **Email is sent** (via Supabase or Resend)
4. **User clicks link** → automatically logs in
5. **Profile is auto-created** via database trigger
6. **User can access** all spaces they're invited to

### Troubleshooting User Management

**Magic links not working?**

- Check spam folder
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check Supabase → Authentication → URL Configuration
- Ensure redirect URLs include your domain

**Users can still sign up?**

- Double-check: Supabase → Authentication → Providers → Email
- "Enable email signup" should be OFF
- "Enable email login" should be ON

**Emails not sending?**

- Check Supabase Dashboard → Authentication → Logs
- Verify RESEND_API_KEY is set (if using Resend)
- Check Resend dashboard for delivery status

**Admin panel not accessible?**

- Make sure you're logged in
- Check that middleware isn't blocking the route
- Any authenticated user can currently access `/app/admin`

## How It Works

### Authentication Flow

1. User enters their email on the login page
2. Supabase sends a magic link to the email
3. User clicks the link and is authenticated
4. User is redirected to the spaces page

### Profiles

When a user signs up (first time logging in):
- A trigger automatically creates a profile in the `profiles` table
- The profile stores their email and a display name (defaults to the part before @ in their email)
- Profiles are used to show member names in the assignee dropdown and throughout the app

### Invites Flow

**Inviting a member:**
1. Space owner enters an email address in the invite form
2. An invite record is created in `space_invites` table
3. The invitee will see the pending invite next time they log in

**Accepting an invite:**
1. User logs in and sees pending invites at the top of the spaces page
2. User clicks "Accept" on an invite
3. The system:
   - Adds them to `space_members` with the specified role
   - Marks the invite as accepted (sets `accepted_at`)
   - Redirects them to the space's Today view

**Note**: Invites are email-based, so the invitee must log in with the same email address they were invited with.

### Daily Pages

- Each space has daily pages (one per date)
- When you visit `/app/spaces/{spaceId}/today`, the app automatically creates a daily page for today's date if it doesn't exist
- All bullets are associated with a specific daily page

### Row Level Security (RLS)

All database access is controlled by RLS policies:

- **Spaces**: Users can only see spaces they're members of
- **Bullets**: Users can see all non-private bullets in their spaces, plus their own private bullets
- **Profiles**: Users can see profiles of people they share spaces with
- **Invites**: Users can see invites they've sent (if owner) or received (if invitee)

This ensures data security at the database level, not just in the application code.

### Keyboard Shortcuts

- Press `/` anywhere on the Today page to focus the quick-add input
- Press `Enter` in the quick-add input to create a bullet
- The input stays focused after adding, allowing rapid consecutive entries

## Database Schema

### Core Tables

1. **profiles**: User profiles (auto-created on signup)
2. **spaces**: Shared workspaces
3. **space_members**: Junction table for space membership
4. **space_invites**: Pending email invitations
5. **daily_pages**: One page per space per date
6. **bullets**: Individual tasks/bullets

See `supabase/schema.sql` for the complete schema with constraints and indexes.

## Development

### Project Structure

```
├── app/
│   ├── actions.ts              # Server actions for all mutations
│   ├── app/
│   │   ├── layout.tsx          # App layout with nav
│   │   └── spaces/
│   │       ├── page.tsx        # Spaces list page
│   │       ├── CreateSpaceForm.tsx
│   │       ├── InviteForm.tsx
│   │       ├── PendingInvites.tsx
│   │       └── [spaceId]/
│   │           └── today/
│   │               ├── page.tsx        # Today view page
│   │               ├── QuickAdd.tsx    # Quick add component
│   │               └── BulletList.tsx  # Bullet list with actions
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (redirects to login)
│   └── globals.css             # Global styles
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client
├── middleware.ts               # Session refresh & route protection
├── supabase/
│   └── schema.sql              # Database schema
└── [config files]
```

### Server Actions

All mutations use Next.js server actions (defined in `app/actions.ts`):
- `createSpace()` - Create a new space
- `inviteToSpace()` - Invite a user by email
- `acceptInvite()` - Accept a pending invite
- `createBullet()` - Create a new bullet
- `toggleBulletStatus()` - Toggle between open/done
- `cancelBullet()` - Mark as canceled
- `deleteBullet()` - Delete a bullet
- `toggleBulletPrivate()` - Toggle private flag
- `updateBulletAssignee()` - Assign to a member
- `ensureDailyPage()` - Get or create daily page

### Building for Production

```bash
npm run build
npm run start
```

## License

MIT
