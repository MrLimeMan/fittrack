-- Workout Tracker - Initial Schema Migration
-- For Supabase (PostgreSQL)

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Group Members (junction table)
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Exercises (shared catalog)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  muscle_groups TEXT[],
  equipment TEXT[],
  difficulty TEXT,
  instructions TEXT,
  demo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workout Plans
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workout Plan Exercises (junction between plans and exercises)
CREATE TABLE workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  target_sets INT,
  target_reps TEXT,
  target_weight TEXT,
  target_duration INT,
  notes TEXT
);

-- Workouts (logged workout sessions)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  log_mode TEXT,
  workout_type TEXT,
  note TEXT,
  duration_minutes INT,
  exercises JSONB DEFAULT '[]'::jsonb,
  performed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Reactions on workouts
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (workout_id, user_id, emoji)
);

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

-- Check if user is a member of a specific group
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user owns a workout
CREATE OR REPLACE FUNCTION public.owns_workout(_workout_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workouts
    WHERE id = _workout_id AND user_id = _user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- PROFILES policies
-- -------------------------------------------------------

-- Everyone can read all profiles
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup trigger)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- GROUPS policies
-- -------------------------------------------------------

-- Group members can read their groups
CREATE POLICY "groups_select_members"
  ON groups FOR SELECT
  TO authenticated
  USING (is_group_member(id, auth.uid()));

-- Authenticated users can create groups
CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- -------------------------------------------------------
-- GROUP MEMBERS policies
-- -------------------------------------------------------

-- Group members can see who is in their groups
CREATE POLICY "group_members_select_members"
  ON group_members FOR SELECT
  TO authenticated
  USING (is_group_member(group_id, auth.uid()));

-- Group admins or the user themselves can insert
CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    -- Allow if inviter is an admin of the group
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- EXERCISES policies
-- -------------------------------------------------------

-- All authenticated users can read exercises
CREATE POLICY "exercises_select_all"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert exercises (community catalog)
CREATE POLICY "exercises_insert_authenticated"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- -------------------------------------------------------
-- WORKOUT PLANS policies
-- -------------------------------------------------------

-- Public templates are readable by everyone
-- Private plans are readable only by the owner
CREATE POLICY "workout_plans_select"
  ON workout_plans FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR is_group_member(group_id, auth.uid())
  );

-- Users can insert their own plans
CREATE POLICY "workout_plans_insert"
  ON workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plans
CREATE POLICY "workout_plans_update_own"
  ON workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own plans
CREATE POLICY "workout_plans_delete_own"
  ON workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- WORKOUT PLAN EXERCISES policies
-- -------------------------------------------------------

-- If you can see the plan, you can see its exercises
CREATE POLICY "workout_plan_exercises_select"
  ON workout_plan_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id
        AND (
          wp.is_public = true
          OR wp.user_id = auth.uid()
          OR is_group_member(wp.group_id, auth.uid())
        )
    )
  );

-- If you own the plan, you can add exercises to it
CREATE POLICY "workout_plan_exercises_insert"
  ON workout_plan_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

-- If you own the plan, you can update its exercises
CREATE POLICY "workout_plan_exercises_update"
  ON workout_plan_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

-- If you own the plan, you can delete its exercises
CREATE POLICY "workout_plan_exercises_delete"
  ON workout_plan_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- WORKOUTS policies
-- -------------------------------------------------------

-- Anyone in a group can read workouts for that group
CREATE POLICY "workouts_select_group"
  ON workouts FOR SELECT
  TO authenticated
  USING (is_group_member(group_id, auth.uid()));

-- Anyone in a group can insert workouts for that group
CREATE POLICY "workouts_insert_group"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND auth.uid() = user_id
  );

-- Users can update their own workouts
CREATE POLICY "workouts_update_own"
  ON workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "workouts_delete_own"
  ON workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- REACTIONS policies
-- -------------------------------------------------------

-- Readable on group workouts (if you're in the group)
CREATE POLICY "reactions_select_group"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id
        AND is_group_member(w.group_id, auth.uid())
    )
  );

-- Anyone in the group can insert reactions on group workouts
CREATE POLICY "reactions_insert_group"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id
        AND is_group_member(w.group_id, auth.uid())
    )
  );

-- Users can only delete their own reactions
CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_invite_code ON groups(invite_code);
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_group ON workouts(group_id);
CREATE INDEX idx_workouts_performed_at ON workouts(performed_at DESC);
CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX idx_workout_plans_group ON workout_plans(group_id);
CREATE INDEX idx_workout_plan_exercises_plan ON workout_plan_exercises(plan_id);
CREATE INDEX idx_workouts_exercises_gin ON workouts USING GIN(exercises);
CREATE INDEX idx_reactions_workout ON reactions(workout_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);
