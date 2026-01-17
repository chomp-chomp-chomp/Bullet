# Bullet Journal Web App

A minimal shared bullet journal web app built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

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
