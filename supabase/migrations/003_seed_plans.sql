-- Starter Workout Plans Seed Data
-- Pre-built plans users can import and customize

BEGIN;

-- Plan 1: Full Body Beginner (3x/week)
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Full Body Beginner', 'A 3-day full body program perfect for beginners. Focus on compound movements with progressive overload. Rest 60-90 seconds between sets.', true, true);

-- Plan 2: Push/Pull/Legs Split
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Push/Pull/Legs Split', 'A 5-6 day intermediate split. Push day focuses on chest/shoulders/triceps, Pull on back/biceps, Legs on quads/hamstrings/glutes.', true, true);

-- Plan 3: Calisthenics Progression
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Calisthenics Progression', 'Bodyweight-focused program with progressive difficulty. Follow the progression chains to build up to advanced skills like muscle-ups and handstand push-ups.', true, true);

-- Plan 4: Home Workout (No Equipment)
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Home Workout (No Equipment)', 'Complete workout you can do anywhere with zero equipment. Mix of strength and cardio for general fitness.', true, true);

-- Plan 5: Big 5 Strength
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Big 5 Strength', 'The five foundational barbell lifts: Squat, Bench Press, Deadlift, Overhead Press, and Row. Simple, effective, time-tested.', true, true);

-- Plan 6: Quick Hit (20-30 Min)
INSERT INTO workout_plans (name, description, is_template, is_public) VALUES
('Quick Hit (20-30 Min)', 'For the busy days. A fast full-body blast you can do anywhere. Minimal rest between exercises, maximum efficiency. Get in, get out, still made progress.', true, true);

DO $$
DECLARE
    plan_quickhit_id UUID;
    plan_fullbody_id UUID;
    plan_home_id UUID;
    plan_big5_id UUID;
BEGIN
    SELECT id INTO plan_quickhit_id FROM workout_plans WHERE name = 'Quick Hit (20-30 Min)';
    SELECT id INTO plan_fullbody_id FROM workout_plans WHERE name = 'Full Body Beginner';
    SELECT id INTO plan_home_id FROM workout_plans WHERE name = 'Home Workout (No Equipment)';
    SELECT id INTO plan_big5_id FROM workout_plans WHERE name = 'Big 5 Strength';

    -- Plan 1: Full Body Beginner
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 1, 3, '8-12', 'Warm up with 2 light sets'
    FROM exercises e WHERE e.name = 'Barbell Back Squat' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 2, 3, '8-12', NULL
    FROM exercises e WHERE e.name = 'Barbell Bench Press' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 3, 3, '8-12', NULL
    FROM exercises e WHERE e.name = 'Barbell Bent-Over Row' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 4, 3, '8-12', NULL
    FROM exercises e WHERE e.name = 'Barbell Overhead Press' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 5, 3, '10-15', NULL
    FROM exercises e WHERE e.name = 'Dumbbell Bicep Curl' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_fullbody_id, e.id, 6, 3, '30-60 sec', 'Hold for time'
    FROM exercises e WHERE e.name = 'Front Plank' LIMIT 1;

    -- Plan 4: Home Workout
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 1, 3, '10-15', NULL
    FROM exercises e WHERE e.name = 'Standard Push-Up' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 2, 3, '10-15', NULL
    FROM exercises e WHERE e.name = 'Bodyweight Squat' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 3, 3, '10-15', NULL
    FROM exercises e WHERE e.name = 'Walking Lunge' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 4, 3, '10-15', NULL
    FROM exercises e WHERE e.name = 'Diamond Push-Up' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 5, 3, '30-60 sec', NULL
    FROM exercises e WHERE e.name = 'Front Plank' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_home_id, e.id, 6, 3, '10-15', 'Explosive movement'
    FROM exercises e WHERE e.name = 'Burpees' LIMIT 1;

    -- Plan 5: Big 5 Strength
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 1, 5, '5', 'Work up to heavy weight'
    FROM exercises e WHERE e.name = 'Barbell Back Squat' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 2, 5, '5', NULL
    FROM exercises e WHERE e.name = 'Barbell Bench Press' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 3, 5, '5', 'Reset each rep from floor'
    FROM exercises e WHERE e.name = 'Barbell Deadlift' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 4, 5, '5', NULL
    FROM exercises e WHERE e.name = 'Barbell Overhead Press' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_big5_id, e.id, 5, 5, '5', NULL
    FROM exercises e WHERE e.name = 'Barbell Bent-Over Row' LIMIT 1;

    -- Plan 6: Quick Hit exercises
    -- Superset style: minimal rest, maximum output

    -- Superset 1: Push + Pull (2 rounds)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 1, 2, '12-15', 'Superset with Rows — no rest between'
    FROM exercises e WHERE e.name = 'Standard Push-Up' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 2, 2, '12-15', 'Superset with Push-Ups — no rest between'
    FROM exercises e WHERE e.name = 'Inverted Row (Australian Pull-Up)' LIMIT 1;

    -- Superset 2: Legs + Core (2 rounds)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 3, 2, '15-20', 'Superset with Plank — no rest between'
    FROM exercises e WHERE e.name = 'Bodyweight Squat' LIMIT 1;

    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 4, 2, '30-45 sec', 'Superset with Squats — hold for time'
    FROM exercises e WHERE e.name = 'Front Plank' LIMIT 1;

    -- Finisher: Full body burnout (1 round)
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    SELECT plan_quickhit_id, e.id, 5, 1, '10', 'All out — this is the finisher'
    FROM exercises e WHERE e.name = 'Burpees' LIMIT 1;


END $$;

COMMIT;
