-- Seed exercises for Push/Pull/Legs Split and Calisthenics Progression templates
BEGIN;

-- Push/Pull/Legs Split: Push Day
DO $$
DECLARE
  ppl_id UUID;
  ex_id UUID;
BEGIN
  SELECT id INTO ppl_id FROM workout_plans WHERE name = 'Push/Pull/Legs Split' AND is_template = true LIMIT 1;

  IF ppl_id IS NOT NULL THEN
    -- Push exercises
    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Bench Press' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 1, 4, '8-12', 'Push Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Overhead Press' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 2, 3, '10-12', 'Push Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Dumbbell Lateral Raise' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 3, 3, '12-15', 'Push Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Dumbbell Chest Fly' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 4, 3, '12-15', 'Push Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Diamond Push-Up' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 5, 3, '12-15', 'Push Day — tricep finisher');

    -- Pull exercises
    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Bent-Over Row' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 6, 4, '8-12', 'Pull Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Standard Pull-Up (Overhand)' LIMIT 1;
    IF ex_id IS NULL THEN
      SELECT id INTO ex_id FROM exercises WHERE name LIKE '%Pull-Up%' AND difficulty = 'intermediate' LIMIT 1;
    END IF;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 7, 3, '8-12', 'Pull Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Dumbbell Bicep Curl' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 8, 3, '10-15', 'Pull Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Dumbbell Hammer Curl' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 9, 3, '10-15', 'Pull Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Dumbbell Reverse Fly' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 10, 3, '12-15', 'Pull Day — rear delt');

    -- Leg exercises
    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Back Squat' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 11, 4, '8-12', 'Leg Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Romanian Deadlift' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 12, 3, '10-12', 'Leg Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Lunge' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 13, 3, '10-12', 'Leg Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Barbell Hip Thrust' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 14, 3, '12-15', 'Leg Day');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Calf Stretch (Wall/Step)' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (ppl_id, ex_id, 15, 3, '15-20', 'Leg Day — calves');
  END IF;
END $$;

-- Calisthenics Progression
DO $$
DECLARE
  cal_id UUID;
  ex_id UUID;
BEGIN
  SELECT id INTO cal_id FROM workout_plans WHERE name = 'Calisthenics Progression' AND is_template = true LIMIT 1;

  IF cal_id IS NOT NULL THEN
    SELECT id INTO ex_id FROM exercises WHERE name = 'Standard Push-Up' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 1, 3, '10-15', 'Push progression base');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Parallel Bar Dip' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 2, 3, '8-12', 'Push progression');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Pike Push-Up' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 3, 3, '8-12', 'Push progression — shoulders');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Standard Pull-Up (Overhand)' LIMIT 1;
    IF ex_id IS NULL THEN
      SELECT id INTO ex_id FROM exercises WHERE name LIKE '%Pull-Up%' AND difficulty = 'intermediate' LIMIT 1;
    END IF;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 4, 3, '5-10', 'Pull progression base');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Inverted Row (Australian Pull-Up)' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 5, 3, '10-15', 'Pull progression — rows');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Bodyweight Squat' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 6, 3, '15-20', 'Leg progression base');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Bulgarian Split Squat' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 7, 3, '8-12', 'Leg progression — single leg');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Front Plank' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 8, 3, '30-60 sec', 'Core — hollow body progression');

    SELECT id INTO ex_id FROM exercises WHERE name = 'Hanging Leg Raise' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 9, 3, '8-12', 'Core — advanced');

    SELECT id INTO ex_id FROM exercises WHERE name = 'L-Sit' LIMIT 1;
    INSERT INTO workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, notes)
    VALUES (cal_id, ex_id, 10, 3, '10-30 sec', 'Core — skill work');
  END IF;
END $$;

COMMIT;
