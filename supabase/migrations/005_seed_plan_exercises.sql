-- Seed exercises for starter workout plans
-- Populates Full Body Beginner, Quick Hit, and Big 5 Strength plans
-- with their pre-configured exercises. Plans are looked up by name.
-- Uses ON CONFLICT DO NOTHING so this migration is safe to re-run.

BEGIN;

DO $$
DECLARE
    plan_fullbody_id UUID;
    plan_quickhit_id UUID;
    plan_big5_id UUID;
BEGIN
    -- Look up the starter plans by name (they have no user_id)
    SELECT id INTO plan_fullbody_id
      FROM workout_plans
     WHERE name = 'Full Body Beginner' AND is_template = true;

    SELECT id INTO plan_quickhit_id
      FROM workout_plans
     WHERE name = 'Quick Hit (20-30 Min)' AND is_template = true;

    SELECT id INTO plan_big5_id
      FROM workout_plans
     WHERE name = 'Big 5 Strength' AND is_template = true;

    -- ================================================================
    -- Plan 1: Full Body Beginner — 6 exercises, 3 sets each
    -- ================================================================

    -- 1) Barbell Back Squat (3x8-12)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 1, 3, '8-12', 'Warm up with 2 light sets'
      FROM exercises e WHERE e.name = 'Barbell Back Squat'
    ON CONFLICT DO NOTHING;

    -- 2) Barbell Bench Press (3x8-12)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 2, 3, '8-12', NULL
      FROM exercises e WHERE e.name = 'Barbell Bench Press'
    ON CONFLICT DO NOTHING;

    -- 3) Barbell Bent-Over Row (3x8-12)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 3, 3, '8-12', NULL
      FROM exercises e WHERE e.name = 'Barbell Bent-Over Row'
    ON CONFLICT DO NOTHING;

    -- 4) Barbell Overhead Press (3x8-12)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 4, 3, '8-12', NULL
      FROM exercises e WHERE e.name = 'Barbell Overhead Press'
    ON CONFLICT DO NOTHING;

    -- 5) Dumbbell Bicep Curl (3x10-15)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 5, 3, '10-15', NULL
      FROM exercises e WHERE e.name = 'Dumbbell Bicep Curl'
    ON CONFLICT DO NOTHING;

    -- 6) Front Plank (3x30-60 sec)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 6, 3, '30-60 sec', 'Hold for time'
      FROM exercises e WHERE e.name = 'Front Plank'
    ON CONFLICT DO NOTHING;

    -- ================================================================
    -- Plan 2: Quick Hit (20-30 Min) — 5 exercises, superset style
    -- ================================================================

    -- Superset 1: Push + Pull (2 rounds)
    -- 1) Standard Push-Up (2x12-15, superset with rows)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 1, 2, '12-15', 'Superset with Rows — no rest between'
      FROM exercises e WHERE e.name = 'Standard Push-Up'
    ON CONFLICT DO NOTHING;

    -- 2) Inverted Row / Australian Pull-Up (2x12-15, superset with push-ups)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 2, 2, '12-15', 'Superset with Push-Ups — no rest between'
      FROM exercises e WHERE e.name = 'Inverted Row (Australian Pull-Up)'
    ON CONFLICT DO NOTHING;

    -- Superset 2: Legs + Core (2 rounds)
    -- 3) Bodyweight Squat (2x15-20, superset with plank)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 3, 2, '15-20', 'Superset with Plank — no rest between'
      FROM exercises e WHERE e.name = 'Bodyweight Squat'
    ON CONFLICT DO NOTHING;

    -- 4) Front Plank (2x30-45 sec, superset with squats)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 4, 2, '30-45 sec', 'Superset with Squats — hold for time'
      FROM exercises e WHERE e.name = 'Front Plank'
    ON CONFLICT DO NOTHING;

    -- Finisher
    -- 5) Burpees (1x10, finisher)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 5, 1, '10', 'All out — this is the finisher'
      FROM exercises e WHERE e.name = 'Burpees'
    ON CONFLICT DO NOTHING;

    -- ================================================================
    -- Plan 3: Big 5 Strength — 5 exercises, 5 sets of 5
    -- ================================================================

    -- 1) Barbell Back Squat (5x5)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 1, 5, '5', 'Work up to heavy weight'
      FROM exercises e WHERE e.name = 'Barbell Back Squat'
    ON CONFLICT DO NOTHING;

    -- 2) Barbell Bench Press (5x5)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 2, 5, '5', NULL
      FROM exercises e WHERE e.name = 'Barbell Bench Press'
    ON CONFLICT DO NOTHING;

    -- 3) Barbell Deadlift (5x5)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 3, 5, '5', 'Reset each rep from floor'
      FROM exercises e WHERE e.name = 'Barbell Deadlift'
    ON CONFLICT DO NOTHING;

    -- 4) Barbell Overhead Press (5x5)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 4, 5, '5', NULL
      FROM exercises e WHERE e.name = 'Barbell Overhead Press'
    ON CONFLICT DO NOTHING;

    -- 5) Barbell Bent-Over Row (5x5)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 5, 5, '5', NULL
      FROM exercises e WHERE e.name = 'Barbell Bent-Over Row'
    ON CONFLICT DO NOTHING;

    -- ================================================================
    -- Plans left empty (users add exercises manually):
    --   Push/Pull/Legs Split
    --   Calisthenics Progression
    --   Home Workout (No Equipment)
    -- ================================================================

END $$;

COMMIT;
