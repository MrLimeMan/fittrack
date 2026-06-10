-- Migration: Add primary_muscles and secondary_muscles columns to exercises
-- This distinguishes which muscles an exercise primarily targets vs synergists.

BEGIN;

-- Add new columns
ALTER TABLE exercises ADD COLUMN primary_muscles text[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN secondary_muscles text[] DEFAULT '{}';

-- ============================================================
-- Barbell exercises
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Barbell Back Squat';

UPDATE exercises
SET primary_muscles = ARRAY['chest']::text[],
    secondary_muscles = ARRAY['triceps', 'shoulders']::text[]
WHERE name = 'Barbell Bench Press';

UPDATE exercises
SET primary_muscles = ARRAY['back', 'glutes', 'hamstrings']::text[],
    secondary_muscles = ARRAY['forearms', 'core', 'legs']::text[]
WHERE name = 'Barbell Deadlift';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = ARRAY['triceps', 'core']::text[]
WHERE name = 'Barbell Overhead Press';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = ARRAY['biceps', 'forearms', 'core']::text[]
WHERE name = 'Barbell Bent-Over Row';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'core']::text[],
    secondary_muscles = ARRAY['glutes', 'shoulders']::text[]
WHERE name = 'Barbell Front Squat';

UPDATE exercises
SET primary_muscles = ARRAY['hamstrings', 'glutes']::text[],
    secondary_muscles = ARRAY['back', 'forearms']::text[]
WHERE name = 'Barbell Romanian Deadlift';

UPDATE exercises
SET primary_muscles = ARRAY['glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Barbell Hip Thrust';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Barbell Lunge';

UPDATE exercises
SET primary_muscles = ARRAY['triceps']::text[],
    secondary_muscles = ARRAY['chest', 'shoulders']::text[]
WHERE name = 'Barbell Close-Grip Bench Press';

UPDATE exercises
SET primary_muscles = ARRAY['triceps']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Barbell Skull Crushers';

UPDATE exercises
SET primary_muscles = ARRAY['biceps']::text[],
    secondary_muscles = ARRAY['forearms']::text[]
WHERE name = 'Barbell Curl';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = ARRAY['biceps', 'forearms', 'core']::text[]
WHERE name = 'Barbell Pendlay Row';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Barbell Shrugs';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = ARRAY['biceps', 'back']::text[]
WHERE name = 'Barbell Upright Row';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders', 'legs']::text[],
    secondary_muscles = ARRAY['back', 'core', 'triceps']::text[]
WHERE name = 'Barbell Clean and Press';

UPDATE exercises
SET primary_muscles = ARRAY['chest']::text[],
    secondary_muscles = ARRAY['triceps', 'shoulders']::text[]
WHERE name = 'Barbell Floor Press';

UPDATE exercises
SET primary_muscles = ARRAY['hamstrings', 'glutes']::text[],
    secondary_muscles = ARRAY['back', 'core']::text[]
WHERE name = 'Barbell Good Mornings';

UPDATE exercises
SET primary_muscles = ARRAY['quads']::text[],
    secondary_muscles = ARRAY['glutes']::text[]
WHERE name = 'Barbell Hack Squat';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'back', 'core']::text[]
WHERE name = 'Barbell Sumo Deadlift';

-- ============================================================
-- Dumbbell exercises
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['chest']::text[],
    secondary_muscles = ARRAY['triceps', 'shoulders']::text[]
WHERE name = 'Dumbbell Bench Press';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = ARRAY['triceps', 'core']::text[]
WHERE name = 'Dumbbell Shoulder Press';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Dumbbell Lateral Raise';

UPDATE exercises
SET primary_muscles = ARRAY['biceps']::text[],
    secondary_muscles = ARRAY['forearms']::text[]
WHERE name = 'Dumbbell Bicep Curl';

UPDATE exercises
SET primary_muscles = ARRAY['triceps']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Dumbbell Tricep Kickback';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = ARRAY['biceps', 'forearms', 'core']::text[]
WHERE name = 'Dumbbell Row (Single-Arm)';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['core', 'hamstrings']::text[]
WHERE name = 'Dumbbell Goblet Squat';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Dumbbell Lunges (Walking)';

UPDATE exercises
SET primary_muscles = ARRAY['chest']::text[],
    secondary_muscles = ARRAY['shoulders']::text[]
WHERE name = 'Dumbbell Chest Fly';

UPDATE exercises
SET primary_muscles = ARRAY['chest', 'shoulders']::text[],
    secondary_muscles = ARRAY['triceps']::text[]
WHERE name = 'Dumbbell Incline Bench Press';

UPDATE exercises
SET primary_muscles = ARRAY['hamstrings', 'glutes']::text[],
    secondary_muscles = ARRAY['back', 'forearms']::text[]
WHERE name = 'Dumbbell Romanian Deadlift';

UPDATE exercises
SET primary_muscles = ARRAY['back', 'core']::text[],
    secondary_muscles = ARRAY['biceps', 'shoulders']::text[]
WHERE name = 'Dumbbell Renegade Row';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = ARRAY['triceps', 'core']::text[]
WHERE name = 'Dumbbell Arnold Press';

UPDATE exercises
SET primary_muscles = ARRAY['biceps']::text[],
    secondary_muscles = ARRAY['forearms']::text[]
WHERE name = 'Dumbbell Hammer Curl';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Dumbbell Front Raise';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'calves']::text[]
WHERE name = 'Dumbbell Step-Up';

UPDATE exercises
SET primary_muscles = ARRAY['triceps']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Dumbbell Overhead Tricep Extension';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Dumbbell Bulgarian Split Squat';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = ARRAY['biceps', 'forearms']::text[]
WHERE name = 'Dumbbell Chest-Supported Row';

UPDATE exercises
SET primary_muscles = ARRAY['shoulders']::text[],
    secondary_muscles = ARRAY['back']::text[]
WHERE name = 'Dumbbell Reverse Fly';

-- ============================================================
-- Bodyweight exercises
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['chest']::text[],
    secondary_muscles = ARRAY['triceps', 'shoulders', 'core']::text[]
WHERE name = 'Standard Push-Up';

UPDATE exercises
SET primary_muscles = ARRAY['triceps']::text[],
    secondary_muscles = ARRAY['chest', 'shoulders']::text[]
WHERE name = 'Diamond Push-Up';

UPDATE exercises
SET primary_muscles = ARRAY['back']::text[],
    secondary_muscles = ARRAY['biceps', 'forearms', 'core']::text[]
WHERE name = 'Standard Pull-Up (Overhand)';

UPDATE exercises
SET primary_muscles = ARRAY['back', 'biceps']::text[],
    secondary_muscles = ARRAY['forearms', 'core']::text[]
WHERE name = 'Chin-Up (Underhand)';

UPDATE exercises
SET primary_muscles = ARRAY['triceps', 'chest']::text[],
    secondary_muscles = ARRAY['shoulders', 'core']::text[]
WHERE name = 'Parallel Bar Dip';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings']::text[]
WHERE name = 'Bodyweight Squat';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['calves']::text[]
WHERE name = 'Jump Squat';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings']::text[]
WHERE name = 'Bulgarian Split Squat';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['hamstrings', 'core']::text[]
WHERE name = 'Walking Lunge';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['calves', 'core']::text[]
WHERE name = 'Pistol Squat';

UPDATE exercises
SET primary_muscles = ARRAY['hamstrings']::text[],
    secondary_muscles = ARRAY['glutes', 'calves']::text[]
WHERE name = 'Nordic Hamstring Curl';

-- ============================================================
-- Core exercises
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Front Plank';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Side Plank';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Hollow Body Hold';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Hanging Leg Raise';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = ARRAY['back']::text[]
WHERE name = 'Toes-to-Bar';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Dragon Flag';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = ARRAY['back']::text[]
WHERE name = 'Ab Wheel Rollout';

-- ============================================================
-- Cardio / conditioning
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['chest', 'quads']::text[],
    secondary_muscles = ARRAY['shoulders', 'core']::text[]
WHERE name = 'Burpees';

UPDATE exercises
SET primary_muscles = ARRAY['core']::text[],
    secondary_muscles = ARRAY['quads', 'shoulders']::text[]
WHERE name = 'Mountain Climbers';

UPDATE exercises
SET primary_muscles = ARRAY['glutes', 'hamstrings']::text[],
    secondary_muscles = ARRAY['core', 'shoulders']::text[]
WHERE name = 'Kettlebell Swing';

UPDATE exercises
SET primary_muscles = ARRAY['calves']::text[],
    secondary_muscles = ARRAY['shoulders', 'forearms', 'core']::text[]
WHERE name = 'Jump Rope';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'hamstrings', 'calves']::text[],
    secondary_muscles = ARRAY['glutes', 'core']::text[]
WHERE name = 'Running (Outdoor/Treadmill)';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes']::text[],
    secondary_muscles = ARRAY['calves']::text[]
WHERE name = 'Box Jumps';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'hip_flexors']::text[],
    secondary_muscles = ARRAY['core', 'calves']::text[]
WHERE name = 'High Knees';

UPDATE exercises
SET primary_muscles = ARRAY['quads', 'glutes', 'hamstrings']::text[],
    secondary_muscles = ARRAY['calves', 'core']::text[]
WHERE name = 'Sprints';

-- ============================================================
-- Stretching / mobility
-- ============================================================

UPDATE exercises
SET primary_muscles = ARRAY['hamstrings', 'calves']::text[],
    secondary_muscles = ARRAY['shoulders', 'back']::text[]
WHERE name = 'Downward Dog';

UPDATE exercises
SET primary_muscles = ARRAY['hip_flexors', 'quads']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Hip Flexor Stretch (Half-Kneeling)';

UPDATE exercises
SET primary_muscles = ARRAY['glutes', 'hip_flexors']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Pigeon Pose';

UPDATE exercises
SET primary_muscles = ARRAY['back', 'core']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Cat-Cow Stretch';

UPDATE exercises
SET primary_muscles = ARRAY['back', 'shoulders']::text[],
    secondary_muscles = '{}'::text[]
WHERE name = 'Child''s Pose';

UPDATE exercises
SET primary_muscles = ARRAY['hip_flexors', 'hamstrings']::text[],
    secondary_muscles = ARRAY['back', 'shoulders']::text[]
WHERE name = 'World''s Greatest Stretch';

-- ============================================================
-- Catch-all: set primary_muscles = muscle_groups for any
-- exercise not explicitly updated above
-- ============================================================

UPDATE exercises
SET primary_muscles = muscle_groups,
    secondary_muscles = '{}'
WHERE primary_muscles = '{}' AND secondary_muscles = '{}';

COMMIT;
