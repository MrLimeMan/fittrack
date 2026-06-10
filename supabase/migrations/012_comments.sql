BEGIN;

CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS disabled (app handles auth)

CREATE INDEX idx_comments_workout ON comments(workout_id);
CREATE INDEX idx_comments_user ON comments(user_id);

COMMIT;
