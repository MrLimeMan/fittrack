-- Remove duplicate plan exercises (keep only the first of each duplicate)
BEGIN;

DELETE FROM workout_plan_exercises
WHERE id IN (
  SELECT wpe1.id
  FROM workout_plan_exercises wpe1
  INNER JOIN workout_plan_exercises wpe2
    ON wpe1.plan_id = wpe2.plan_id
    AND wpe1.exercise_id = wpe2.exercise_id
    AND wpe1.id > wpe2.id
);

COMMIT;
