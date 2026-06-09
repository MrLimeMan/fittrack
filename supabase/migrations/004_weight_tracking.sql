-- Weight tracking table

BEGIN;

CREATE TABLE IF NOT EXISTS weight_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC(5,1) NOT NULL,  -- e.g. 185.5
  unit text DEFAULT 'lbs',       -- 'lbs' or 'kg'
  note text,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recorded_at)   -- one entry per user per day
);

ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Users can read all weight entries in their group (accountability)
-- But only write their own
CREATE POLICY "Users can read weight entries in their group"
  ON weight_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own weight entries"
  ON weight_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weight entries"
  ON weight_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own weight entries"
  ON weight_entries FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, recorded_at DESC);

COMMIT;
