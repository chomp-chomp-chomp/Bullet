-- Bullet Journal App Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- STEP 1: Helper Functions
-- ============================================================

-- Helper function to get current user's email from JWT
CREATE OR REPLACE FUNCTION auth_email() RETURNS text AS $$
  SELECT current_setting('request.jwt.claim.email', true)::text;
$$ LANGUAGE sql STABLE;

-- Helper function to check if current user is admin
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Create All Tables (without RLS policies)
-- ============================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Space members table
CREATE TABLE IF NOT EXISTS space_members (
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);

-- Space invites table
CREATE TABLE IF NOT EXISTS space_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(space_id, email)
);

-- Daily pages table
CREATE TABLE IF NOT EXISTS daily_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  page_date date NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(space_id, page_date)
);

-- Bullets table
CREATE TABLE IF NOT EXISTS bullets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES daily_pages(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'canceled')),
  is_private boolean DEFAULT false,
  priority text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  sort_key bigint DEFAULT extract(epoch from now()) * 1000000
);

-- ============================================================
-- STEP 3: Create Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS bullets_sort_key_idx ON bullets(page_id, sort_key);
CREATE INDEX IF NOT EXISTS space_members_user_id_idx ON space_members(user_id);
CREATE INDEX IF NOT EXISTS space_members_space_id_idx ON space_members(space_id);
CREATE INDEX IF NOT EXISTS daily_pages_space_date_idx ON daily_pages(space_id, page_date);
CREATE INDEX IF NOT EXISTS bullets_page_id_idx ON bullets(page_id);
CREATE INDEX IF NOT EXISTS bullets_assigned_to_idx ON bullets(assigned_to);
CREATE INDEX IF NOT EXISTS space_invites_email_idx ON space_invites(email);

-- ============================================================
-- STEP 4: Create Triggers and Functions
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Check if this is the first user
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;

  INSERT INTO public.profiles (id, email, display_name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    is_first_user  -- First user becomes admin automatically
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STEP 5: Enable Row Level Security on All Tables
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bullets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of space members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members sm1
      JOIN space_members sm2 ON sm1.space_id = sm2.space_id
      WHERE sm1.user_id = auth.uid()
        AND sm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Spaces RLS Policies
CREATE POLICY "Users can view spaces they are members of"
  ON spaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create spaces"
  ON spaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only space owners can update spaces"
  ON spaces FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Only space owners can delete spaces"
  ON spaces FOR DELETE
  USING (created_by = auth.uid());

-- Space members RLS Policies
-- Fixed to avoid infinite recursion by checking spaces table instead of space_members
CREATE POLICY "Space creators can view all members"
  ON space_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view their own memberships"
  ON space_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Space creators can add members"
  ON space_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Space creators can remove members"
  ON space_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND spaces.created_by = auth.uid()
    )
  );

-- Space invites RLS Policies
CREATE POLICY "Space owners can view invites for their spaces"
  ON space_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invites.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Invitees can view their pending invites"
  ON space_invites FOR SELECT
  USING (
    email = auth_email() AND accepted_at IS NULL
  );

CREATE POLICY "Space owners can create invites"
  ON space_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invites.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Space owners can delete invites"
  ON space_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invites.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Invitees can accept their invites"
  ON space_invites FOR UPDATE
  USING (email = auth_email() AND accepted_at IS NULL)
  WITH CHECK (email = auth_email());

-- Daily pages RLS Policies
CREATE POLICY "Space members can view daily pages"
  ON daily_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = daily_pages.space_id
        AND space_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Space members can create daily pages"
  ON daily_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = daily_pages.space_id
        AND space_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Page creators and owners can update daily pages"
  ON daily_pages FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = daily_pages.space_id
        AND spaces.created_by = auth.uid()
    )
  );

CREATE POLICY "Page creators and owners can delete daily pages"
  ON daily_pages FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = daily_pages.space_id
        AND spaces.created_by = auth.uid()
    )
  );

-- Bullets RLS Policies
CREATE POLICY "Space members can view non-private bullets"
  ON bullets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = bullets.space_id
        AND space_members.user_id = auth.uid()
    )
    AND (is_private = false OR created_by = auth.uid())
  );

CREATE POLICY "Space members can create their own bullets"
  ON bullets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = bullets.space_id
        AND space_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Bullet creators can update their bullets"
  ON bullets FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Bullet creators can delete their bullets"
  ON bullets FOR DELETE
  USING (created_by = auth.uid());
