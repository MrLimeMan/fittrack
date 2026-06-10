-- Migration 011: Exercise Data Cleanup
-- 1. Fix incorrect equipment tags
-- 2. Improve instructions for top exercises (step-by-step format)
-- 3. Add missing exercises

BEGIN;

-- ============================================================
-- PART 1: Fix Equipment Tags
-- ============================================================

-- 'Ab Wheel Rollout' — needs an ab wheel, not bodyweight
UPDATE exercises
SET equipment = ARRAY['ab wheel']::text[]
WHERE name = 'Ab Wheel Rollout';

-- 'L-Sit' — typically done on parallel bars or dip bars/parallettes
UPDATE exercises
SET equipment = ARRAY['parallel bars']::text[]
WHERE name = 'L-Sit';

-- 'Dragon Flag' — performed lying on a bench
UPDATE exercises
SET equipment = ARRAY['bench']::text[]
WHERE name = 'Dragon Flag';

-- 'Nordic Hamstring Curl' — ankles secured under bench or held by partner
UPDATE exercises
SET equipment = ARRAY['bench']::text[]
WHERE name = 'Nordic Hamstring Curl';

-- 'Ring Dip' — performed on gymnastic rings
UPDATE exercises
SET equipment = ARRAY['gymnastic rings']::text[]
WHERE name = 'Ring Dip';

-- 'Scapular Pull-Up' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Scapular Pull-Up';

-- Other equipment fixes

-- 'Parallel Bar Dip' — requires parallel bars or dip station
UPDATE exercises
SET equipment = ARRAY['parallel bars']::text[]
WHERE name = 'Parallel Bar Dip';

-- 'Ring Muscle-Up' — requires gymnastic rings
UPDATE exercises
SET equipment = ARRAY['gymnastic rings']::text[]
WHERE name = 'Ring Muscle-Up';

-- 'Dead Hang' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Dead Hang';

-- 'Negative Pull-Up' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Negative Pull-Up';

-- 'Band-Assisted Pull-Up' — requires a pull-up bar and resistance band
UPDATE exercises
SET equipment = ARRAY['pull-up bar', 'resistance band']::text[]
WHERE name = 'Band-Assisted Pull-Up';

-- 'Standard Pull-Up (Overhand)' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Standard Pull-Up (Overhand)';

-- 'Chin-Up (Underhand)' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Chin-Up (Underhand)';

-- 'Wide-Grip Pull-Up' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Wide-Grip Pull-Up';

-- 'Commando Pull-Up' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Commando Pull-Up';

-- 'Archer Pull-Up' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Archer Pull-Up';

-- 'Hanging Leg Raise' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Hanging Leg Raise';

-- 'Toes-to-Bar' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Toes-to-Bar';

-- 'Inverted Row (Australian Pull-Up)' — typically done on a barbell in a rack or a bar
UPDATE exercises
SET equipment = ARRAY['barbell']::text[]
WHERE name = 'Inverted Row (Australian Pull-Up)';

-- 'Elevated Inverted Row' — requires a bar and a box/bench
UPDATE exercises
SET equipment = ARRAY['barbell', 'bench']::text[]
WHERE name = 'Elevated Inverted Row';

-- 'Tuck Front Lever Row' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Tuck Front Lever Row';

-- 'Kipping Muscle-Up Transition' — requires a pull-up bar
UPDATE exercises
SET equipment = ARRAY['pull-up bar']::text[]
WHERE name = 'Kipping Muscle-Up Transition';

-- 'Ring or Bench Dip' — can be done on rings or a bench; clarify
UPDATE exercises
SET equipment = ARRAY['bench']::text[]
WHERE name = 'Ring or Bench Dip';

-- ============================================================
-- PART 2: Improve Instructions (Top 20+ Most Common Exercises)
-- Using numbered step-by-step format
-- ============================================================

-- Standard Push-Up
UPDATE exercises
SET instructions = '1. Start in a high plank position with hands slightly wider than shoulder-width, fingers spread wide
2. Brace your core and squeeze your glutes — body forms a rigid straight line from head to heels
3. Lower your chest toward the floor by bending elbows to roughly 45 degrees (not flared out to 90)
4. When chest is 2-3 inches from the floor, press through your palms to return to start
5. Lock out at the top without letting your hips sag or pike up
Key cues: Keep neck neutral, breathe in on the way down, exhale as you push up'
WHERE name = 'Standard Push-Up';

-- Barbell Back Squat
UPDATE exercises
SET instructions = '1. Set the bar on your upper traps (high bar) or rear delts (low bar), grip firmly, and unrack with both feet under you
2. Step back and position feet shoulder-width apart with toes pointed slightly outward (15-30 degrees)
3. Take a deep breath, brace your core hard, and break at the hips and knees simultaneously
4. Descend until your hip crease drops below the top of your knee (at least parallel), keeping chest up
5. Drive through your midfoot to stand back up, pushing knees out over toes
Key cues: Maintain a neutral spine throughout, keep weight over midfoot, push the floor apart with your feet'
WHERE name = 'Barbell Back Squat';

-- Barbell Bench Press
UPDATE exercises
SET instructions = '1. Lie on the bench with eyes under the bar, feet flat on the floor
2. Grip the bar slightly wider than shoulder-width, retract and depress your shoulder blades into the bench
3. Unrack the bar and position it over your chest with arms fully extended
4. Lower the bar to your mid-chest with control, keeping elbows at roughly 45 degrees to your torso
5. Press the bar back up in a slight arc until arms are locked out over your shoulders
Key cues: Keep your hips on the bench, maintain the arch in your upper back, drive through your feet'
WHERE name = 'Barbell Bench Press';

-- Barbell Deadlift
UPDATE exercises
SET instructions = '1. Stand with feet hip-width apart, the bar positioned over your midfoot (about 1 inch from shins)
2. Hinge at the hips and grip the bar just outside your knees with a double-overhand or mixed grip
3. Flatten your back, pull your chest up, and brace your core — this sets your starting position
4. Drive through your heels and push the floor away, keeping the bar close to your body as you stand tall
5. Lock out by squeezing your glutes at the top; lower by hinging hips back first, then bending knees once the bar passes them
Key cues: Never round your lower back, keep the bar in contact with your legs throughout, breathe and brace before each rep'
WHERE name = 'Barbell Deadlift';

-- Bodyweight Squat
UPDATE exercises
SET instructions = '1. Stand with feet shoulder-width apart, toes pointed slightly outward
2. Send your hips back and down as if sitting into an invisible chair, keeping your chest tall
3. Descend until your thighs are at least parallel to the floor — ideally your hip crease below knee level
4. Press through your full foot (not just toes) to stand back up, squeezing your glutes at the top
Key cues: Keep your knees tracking over your toes, maintain a neutral spine, look straight ahead — do not let your heels lift off the ground'
WHERE name = 'Bodyweight Squat';

-- Walking Lunge
UPDATE exercises
SET instructions = '1. Stand upright with feet together, core engaged and chest tall
2. Take a large step forward with one leg and lower your back knee toward the floor until both knees are at 90 degrees
3. Your front shin should stay roughly vertical and your front knee should not push past your toes
4. Drive through the heel of your front foot to step the back foot forward into the next lunge
5. Alternate legs with each step, maintaining a smooth, continuous rhythm
Key cues: Keep your torso upright and core braced, avoid leaning to either side, push off the front foot not the back'
WHERE name = 'Walking Lunge';

-- Barbell Overhead Press
UPDATE exercises
SET instructions = '1. Stand with feet hip-width apart, grip the bar at shoulder width with the bar resting on your front deltoids
2. Brace your core and squeeze your glutes to create a solid base
3. Press the bar straight overhead, moving your head slightly back to clear the bar path
4. Lock out with the bar directly over your midfoot, then lower it back to the front deltoids with control
Key cues: Do not lean back excessively, keep your ribcage down (no over-arching), exhale as you press up'
WHERE name = 'Barbell Overhead Press';

-- Barbell Bent-Over Row
UPDATE exercises
SET instructions = '1. Stand with feet hip-width apart, grip the bar slightly wider than shoulder-width
2. Hinge at your hips until your torso is roughly 45 degrees to the floor, knees slightly bent
3. Let the bar hang with arms fully extended, back flat and core braced
4. Pull the bar toward your lower ribs by driving your elbows up and back, squeezing your shoulder blades together at the top
5. Lower the bar under control to the starting position without letting your back round
Key cues: Initiate the pull with your back muscles, not your biceps; keep your spine neutral throughout'
WHERE name = 'Barbell Bent-Over Row';

-- Barbell Romanian Deadlift
UPDATE exercises
SET instructions = '1. Stand with feet hip-width apart, holding the bar at hip level with an overhand grip
2. With a slight bend in your knees (do not lock them), push your hips straight back
3. Lower the bar along your thighs and shins until you feel a strong stretch in your hamstrings (typically mid-shin)
4. Drive your hips forward to return to standing, squeezing your glutes at the top
5. Keep the bar in contact with or very close to your legs throughout the entire movement
Key cues: This is a hip hinge, not a squat — your shins stay vertical; keep your back flat and chest up'
WHERE name = 'Barbell Romanian Deadlift';

-- Dumbbell Bench Press
UPDATE exercises
SET instructions = '1. Lie on a flat bench with a dumbbell in each hand at chest level, palms facing forward
2. Press the dumbbells upward and slightly inward until your arms are fully extended
3. Lower the dumbbells back to chest level with control, letting your elbows flare out to 45-75 degrees
4. Press back up to the starting position, squeezing your chest at the top
Key cues: Each arm works independently — keep both dumbbells moving at the same speed, do not bounce the dumbbells off your chest'
WHERE name = 'Dumbbell Bench Press';

-- Dumbbell Shoulder Press
UPDATE exercises
SET instructions = '1. Sit or stand with core braced, holding dumbbells at shoulder height with palms facing forward
2. Press the dumbbells overhead until your arms are fully extended, dumbbells nearly touching at the top
3. Lower the dumbbells back to shoulder height with control
4. Repeat for the desired number of reps
Key cues: Keep your core tight to avoid arching your lower back, do not let the dumbbells drift behind your head, exhale as you press up'
WHERE name = 'Dumbbell Shoulder Press';

-- Dumbbell Lateral Raise
UPDATE exercises
SET instructions = '1. Stand with dumbbells at your sides, palms facing inward, slight bend in your elbows
2. Raise your arms out to the sides until they reach shoulder height (parallel to the floor)
3. Lead with your elbows, not your hands — imagine pouring water from a pitcher at the top
4. Pause briefly at the top, then lower the dumbbells slowly back to your sides
Key cues: Do not swing or use momentum, keep your torso upright, the slight elbow bend stays constant throughout'
WHERE name = 'Dumbbell Lateral Raise';

-- Dumbbell Bicep Curl
UPDATE exercises
SET instructions = '1. Stand with feet hip-width apart, dumbbells at your sides with palms facing forward
2. Keeping your upper arms locked at your sides, curl the dumbbells toward your shoulders by bending only at the elbows
3. Squeeze your biceps hard at the top for a one-second pause
4. Lower the dumbbells under control back to the starting position
Key cues: Do not swing your body or lean back to cheat the weight up, keep your wrists straight, full range of motion every rep'
WHERE name = 'Dumbbell Bicep Curl';

-- Dumbbell Row (Single-Arm)
UPDATE exercises
SET instructions = '1. Place one knee and the same-side hand on a bench for support, opposite foot on the floor
2. Hold the dumbbell in your free hand with arm extended toward the floor
3. Row the dumbbell toward your hip by driving your elbow up and back, squeezing your shoulder blade at the top
4. Lower the dumbbell under control without letting your torso rotate
5. Complete all reps on one side before switching
Key cues: Keep your hips square to the floor, pull with your back not your arm, avoid rounding your spine'
WHERE name = 'Dumbbell Row (Single-Arm)';

-- Barbell Hip Thrust
UPDATE exercises
SET instructions = '1. Sit on the floor with your upper back against a sturdy bench, knees bent, feet flat on the floor
2. Roll the barbell over your hips (use a pad for comfort) and plant your feet about shoulder-width apart
3. Drive through your heels and squeeze your glutes to lift your hips until your body forms a straight line from knees to shoulders
4. Pause at the top for 1-2 seconds with a hard glute squeeze
5. Lower your hips back down under control without fully resting on the floor
Key cues: Do not hyperextend your lower back at the top — the movement comes from your glutes, chin stays tucked throughout'
WHERE name = 'Barbell Hip Thrust';

-- Bulgarian Split Squat
UPDATE exercises
SET instructions = '1. Stand lunge-distance in front of a bench, placing the top of your rear foot on the bench behind you
2. Hold dumbbells at your sides (or use bodyweight) and keep your torso upright
3. Lower your back knee toward the floor until your front thigh is roughly parallel to the ground
4. Drive through the heel of your front foot to return to standing
5. Complete all reps on one leg before switching sides
Key cues: Your front shin stays roughly vertical, do not let your front knee cave inward, keep your hips square'
WHERE name = 'Bulgarian Split Squat';

-- Front Plank
UPDATE exercises
SET instructions = '1. Place your forearms on the ground with elbows directly under your shoulders
2. Extend your legs behind you, supporting your weight on your forearms and toes
3. Your body should form a perfectly straight line from the crown of your head to your heels
4. Squeeze your glutes and brace your abs as if someone were about to punch your stomach
5. Hold the position without letting your hips sag toward the floor or pike up toward the ceiling
Key cues: Breathe normally while holding, keep your neck neutral by looking at the floor, aim for 30-60 seconds'
WHERE name = 'Front Plank';

-- Barbell Lunge
UPDATE exercises
SET instructions = '1. Place the bar across your upper back (like a squat position) and stand with feet together
2. Take a large step forward with one leg and lower your back knee toward the floor
3. Descend until both knees are at approximately 90 degrees, front knee staying over the ankle
4. Push through your front heel to return to the starting position
5. Alternate legs with each rep, or complete all reps on one side before switching
Key cues: Keep your torso upright and core braced, do not let the front knee track past the toes, control the descent'
WHERE name = 'Barbell Lunge';

-- Diamond Push-Up
UPDATE exercises
SET instructions = '1. Start in a push-up position with your hands together directly under your chest
2. Form a diamond or triangle shape with your index fingers and thumbs
3. Keep your elbows close to your body as you lower your chest toward your hands
4. Press back up to full arm extension, focusing on the tricep contraction at the top
Key cues: Do not let your hips sag, the closer your hands are the harder the exercise, keep your core tight throughout'
WHERE name = 'Diamond Push-Up';

-- Hanging Leg Raise
UPDATE exercises
SET instructions = '1. Hang from a pull-up bar with an overhand grip, shoulder-width apart
2. Engage your core and allow your body to hang with minimal swinging
3. Raise your legs by flexing at the hips until they are parallel to the floor (or higher for advanced)
4. Lower your legs back down under control — do not just let them drop
Key cues: Avoid swinging or using momentum, keep your shoulders engaged (do not sag in the socket), start with bent knees if straight legs are too hard'
WHERE name = 'Hanging Leg Raise';

-- Kettlebell Swing
UPDATE exercises
SET instructions = '1. Stand with feet slightly wider than shoulder-width, kettlebell on the floor about a foot in front of you
2. Hinge at your hips to grip the kettlebell handle with both hands
3. Hike the kettlebell back between your legs like a football snap, then explosively snap your hips forward
4. The kettlebell swings up to chest or eye level — your arms are just hooks, the power comes from your hips
5. Let the kettlebell swing back between your legs as you hinge at the hips for the next rep
Key cues: This is a hip hinge, not a squat — push your hips back, not your knees forward; squeeze your glutes hard at the top'
WHERE name = 'Kettlebell Swing';

-- ============================================================
-- PART 3: Add Missing Exercises
-- ============================================================

-- Calf Raise (Standing)
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Calf Raise (Standing)',
  'strength',
  ARRAY['calves']::text[],
  ARRAY['none']::text[],
  'beginner',
  '1. Stand on the edge of a step or flat ground with feet hip-width apart
2. Rise up onto the balls of your feet as high as possible, pushing through your big toe
3. Squeeze your calves hard at the top and hold for 1 second
4. Lower your heels slowly back down to the starting position (or below the step edge for a deeper stretch)
5. For added resistance, hold dumbbells at your sides or use a machine
Key cues: Keep your core braced and body upright, do not bounce at the bottom, control the eccentric (lowering) phase',
  NULL,
  ARRAY['calves']::text[],
  '{}'::text[]
);

-- Calf Raise (Seated)
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Calf Raise (Seated)',
  'strength',
  ARRAY['calves']::text[],
  ARRAY['machine']::text[],
  'beginner',
  '1. Sit on the calf raise machine with your knees under the padded lever and balls of your feet on the platform
2. Release the safety latch and position your feet so your heels hang off the edge of the platform
3. Lower your heels as far as possible to feel a stretch in your calves
4. Push up onto the balls of your feet as high as you can, squeezing your calves at the top
5. Hold the top position briefly, then lower slowly under control
Key cues: The seated variation targets the soleus muscle more than standing calf raises, use a full range of motion',
  NULL,
  ARRAY['calves']::text[],
  '{}'::text[]
);

-- Leg Extension
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Leg Extension',
  'strength',
  ARRAY['quads']::text[],
  ARRAY['machine']::text[],
  'beginner',
  '1. Sit on the leg extension machine with your back flat against the pad
2. Adjust the pad so it rests on your lower shins just above your ankles
3. Grip the handles on the sides for stability
4. Extend your legs by contracting your quadriceps until your knees are fully straight
5. Pause at the top for a one-second squeeze, then lower slowly back to the starting position
Key cues: Do not lock your knees violently at the top, control the lowering phase, avoid using momentum to swing the weight up',
  NULL,
  ARRAY['quads']::text[],
  '{}'::text[]
);

-- Leg Curl
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Leg Curl',
  'strength',
  ARRAY['hamstrings']::text[],
  ARRAY['machine']::text[],
  'beginner',
  '1. Lie face down on the leg curl machine with the pad resting on the back of your lower legs (just above ankles)
2. Grip the handles for stability and keep your hips pressed flat against the pad
3. Curl your legs toward your glutes by bending at the knees, squeezing your hamstrings at the top
4. Pause briefly at the top, then lower the weight back down under control
5. Avoid lifting your hips off the pad during the movement
Key cues: This is an isolation exercise for the hamstrings, keep the movement smooth and controlled, use a full range of motion',
  NULL,
  ARRAY['hamstrings']::text[],
  '{}'::text[]
);

-- Lat Pulldown
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Lat Pulldown',
  'strength',
  ARRAY['back', 'biceps']::text[],
  ARRAY['cable machine']::text[],
  'beginner',
  '1. Sit at the lat pulldown machine and adjust the thigh pad to hold your legs securely
2. Grip the wide bar with an overhand grip, hands wider than shoulder-width
3. Lean back slightly and pull the bar down toward your upper chest by driving your elbows down and back
4. Squeeze your shoulder blades together at the bottom of the movement
5. Slowly return the bar to the starting position with arms fully extended
Key cues: Do not lean back excessively or use momentum to pull the weight, initiate the pull from your back muscles not your arms, control the eccentric phase',
  NULL,
  ARRAY['back']::text[],
  ARRAY['biceps']::text[]
);

-- Cable Row
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Cable Row',
  'strength',
  ARRAY['back', 'biceps']::text[],
  ARRAY['cable machine']::text[],
  'beginner',
  '1. Sit at a cable row station with feet on the foot platforms and knees slightly bent
2. Grip the V-bar or straight bar attachment with both hands, arms extended
3. Sit tall with your chest up and core braced, maintaining a slight natural arch in your lower back
4. Pull the handle toward your lower abdomen by driving your elbows back and squeezing your shoulder blades together
5. Hold the contraction briefly, then slowly extend your arms back to the starting position
Key cues: Do not round your lower back or lean too far forward, keep your torso relatively upright, pull from your back not your biceps',
  NULL,
  ARRAY['back']::text[],
  ARRAY['biceps']::text[]
);

-- Chest Press Machine
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Chest Press Machine',
  'strength',
  ARRAY['chest', 'triceps', 'shoulders']::text[],
  ARRAY['machine']::text[],
  'beginner',
  '1. Sit on the chest press machine with your back flat against the pad
2. Adjust the seat so the handles are at chest height
3. Grip the handles with palms facing forward, elbows out to the sides
4. Push the handles forward by extending your arms until they are nearly straight
5. Squeeze your chest at the front of the movement, then slowly return to the starting position
Key cues: Keep your back and head against the pad throughout, do not lock your elbows violently at extension, control the eccentric (return) phase',
  NULL,
  ARRAY['chest']::text[],
  ARRAY['triceps', 'shoulders']::text[]
);

-- Tricep Pushdown
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Tricep Pushdown',
  'strength',
  ARRAY['triceps']::text[],
  ARRAY['cable machine']::text[],
  'beginner',
  '1. Stand facing a cable machine with a straight bar or rope attachment set at the top pulley
2. Grip the attachment with palms facing down (straight bar) or neutral (rope), elbows pinned to your sides
3. Push the attachment down by extending your elbows until your arms are fully straight
4. Squeeze your triceps hard at the bottom, then slowly return to the starting position
5. Keep your upper arms stationary throughout — only your forearms move
Key cues: Do not let your elbows drift forward or flare out, control the weight on the way back up, keep your core braced',
  NULL,
  ARRAY['triceps']::text[],
  '{}'::text[]
);

-- Face Pull
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Face Pull',
  'strength',
  ARRAY['shoulders', 'back']::text[],
  ARRAY['cable machine']::text[],
  'beginner',
  '1. Set a cable pulley to face height and attach a rope handle
2. Grip the rope with both hands, palms facing each other, and step back until arms are extended
3. Pull the rope toward your face by driving your elbows back and out to the sides
4. As the rope reaches your face, separate your hands and pull your shoulder blades together
5. Hold the contracted position for one second, then slowly return to the starting position
Key cues: This targets the rear delts and upper back, do not use heavy weight — focus on the squeeze, keep your core braced and avoid leaning back',
  NULL,
  ARRAY['shoulders']::text[],
  ARRAY['back']::text[]
);

-- Farmer Walk
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Farmer Walk',
  'strength',
  ARRAY['forearms', 'core', 'full body']::text[],
  ARRAY['dumbbells']::text[],
  'beginner',
  '1. Pick up a heavy dumbbell in each hand with a strong grip, standing tall
2. Pull your shoulders back and down, brace your core, and set your gaze forward
3. Walk forward at a brisk pace for the prescribed distance or time
4. Keep your torso upright — do not lean to either side or let the weights swing
5. Set the dumbbells down carefully when finished
Key cues: Grip strength is the limiting factor for most people, keep steps short and controlled, breathe rhythmically throughout',
  NULL,
  ARRAY['forearms']::text[],
  ARRAY['core']::text[]
);

-- Glute Bridge
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Glute Bridge',
  'strength',
  ARRAY['glutes', 'hamstrings']::text[],
  ARRAY['none']::text[],
  'beginner',
  '1. Lie on your back with knees bent, feet flat on the floor hip-width apart, arms at your sides
2. Press through your heels and squeeze your glutes to lift your hips off the floor
3. Raise until your body forms a straight line from your knees to your shoulders
4. Hold the top position for 2-3 seconds with a hard glute squeeze
5. Lower your hips back to the floor under control
Key cues: Do not hyperextend your lower back at the top — the movement comes from your glutes, push through your heels not your toes',
  NULL,
  ARRAY['glutes']::text[],
  ARRAY['hamstrings']::text[]
);

-- Hip Thrust (Bodyweight)
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Hip Thrust (Bodyweight)',
  'strength',
  ARRAY['glutes']::text[],
  ARRAY['none']::text[],
  'beginner',
  '1. Sit on the floor with your upper back resting against a bench or sturdy couch
2. Bend your knees and plant your feet flat on the floor about shoulder-width apart
3. Drive through your heels and squeeze your glutes to lift your hips until your torso is parallel to the floor
4. Pause at the top for 2-3 seconds, squeezing your glutes as hard as possible
5. Lower your hips back down slowly without fully resting on the floor
Key cues: Keep your chin tucked and look forward, the movement is driven entirely by your glutes, avoid pushing through your toes',
  NULL,
  ARRAY['glutes']::text[],
  '{}'::text[]
);

-- Plank to Push-Up
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Plank to Push-Up',
  'strength',
  ARRAY['core', 'chest', 'triceps']::text[],
  ARRAY['none']::text[],
  'intermediate',
  '1. Start in a forearm plank position with elbows under your shoulders and body in a straight line
2. Place one hand on the floor and push up to a high plank (push-up position)
3. Place the other hand on the floor so you are in a full push-up position
4. Lower back down one arm at a time to return to the forearm plank
5. Alternate which arm leads each rep to maintain balance
Key cues: Keep your hips as still as possible — minimize rocking, brace your core throughout, do not let your hips pike up',
  NULL,
  ARRAY['core']::text[],
  ARRAY['chest', 'triceps']::text[]
);

-- Side Plank with Rotation
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Side Plank with Rotation',
  'strength',
  ARRAY['core', 'obliques']::text[],
  ARRAY['none']::text[],
  'intermediate',
  '1. Start in a side plank position with your forearm on the ground, elbow under your shoulder, and body in a straight line
2. Extend your top arm toward the ceiling with your gaze following your hand
3. Rotate your top arm and thread it underneath your torso, reaching behind you
4. Rotate back open to the starting position with your arm extended toward the ceiling
5. Complete all reps on one side before switching to the other
Key cues: Keep your hips lifted and stable throughout, the rotation comes from your thoracic spine not your hips, maintain a strong core brace',
  NULL,
  ARRAY['core']::text[],
  ARRAY['obliques']::text[]
);

-- Good Morning (Bodyweight)
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Good Morning (Bodyweight)',
  'strength',
  ARRAY['hamstrings', 'back']::text[],
  ARRAY['none']::text[],
  'beginner',
  '1. Stand with feet hip-width apart, hands placed behind your head or crossed on your chest
2. Maintain a slight bend in your knees and keep your back flat
3. Push your hips straight back, lowering your torso toward the floor
4. Go as low as your hamstring flexibility allows while keeping a flat back (typically until torso is parallel to floor)
5. Drive your hips forward to return to standing, squeezing your glutes at the top
Key cues: This is a hip hinge pattern — think about reaching your butt to the wall behind you, never round your lower back',
  NULL,
  ARRAY['hamstrings']::text[],
  ARRAY['back']::text[]
);

-- Wall Sit
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Wall Sit',
  'strength',
  ARRAY['quads']::text[],
  ARRAY['none']::text[],
  'beginner',
  '1. Stand with your back flat against a wall and walk your feet out about two feet
2. Slide down the wall until your thighs are parallel to the floor and your knees are at 90 degrees
3. Your knees should be directly above your ankles, not pushed forward past your toes
4. Press your entire back flat against the wall and hold the position
5. Hold for 30-60 seconds or as long as you can maintain proper form
Key cues: Keep your head against the wall, do not let your knees cave inward, breathe steadily — this is an isometric hold that burns the quads',
  NULL,
  ARRAY['quads']::text[],
  '{}'::text[]
);

-- Step-Up (Bodyweight)
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Step-Up (Bodyweight)',
  'strength',
  ARRAY['quads', 'glutes']::text[],
  ARRAY['bench']::text[],
  'beginner',
  '1. Stand facing a sturdy bench or box with feet hip-width apart
2. Place one foot entirely on the box, pressing through your heel to drive your body up
3. Step up until both feet are on the box and you are standing fully upright
4. Step back down with the same leg first, controlling the descent
5. Complete all reps on one leg before switching to the other
Key cues: The box height should allow your thigh to be roughly parallel at the bottom, drive through the heel not the toes, keep your torso upright',
  NULL,
  ARRAY['quads', 'glutes']::text[],
  '{}'::text[]
);

-- Sled Push
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Sled Push',
  'strength',
  ARRAY['quads', 'glutes', 'full body']::text[],
  ARRAY['sled']::text[],
  'intermediate',
  '1. Load the sled with an appropriate weight and grip the handles at chest height
2. Position your body at roughly a 45-degree angle with arms extended and core braced
3. Drive forward by pushing through one foot at a time, taking short powerful strides
4. Keep your back flat, hips low, and maintain the forward lean throughout
5. Push the sled the prescribed distance or for a set amount of time
Key cues: Power comes from your legs — drive through the balls of your feet, do not let your hips rise up, keep your core tight and back flat',
  NULL,
  ARRAY['quads', 'glutes']::text[],
  ARRAY['full body']::text[]
);

-- Turkish Get-Up
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, demo_url, primary_muscles, secondary_muscles)
VALUES (
  'Turkish Get-Up',
  'strength',
  ARRAY['full body']::text[],
  ARRAY['kettlebell']::text[],
  'advanced',
  '1. Lie on your back holding a kettlebell in one hand with arm fully extended above your chest
2. Bend the same-side knee and plant that foot flat on the floor
3. Roll onto your opposite forearm, then push up to your hand, keeping the kettlebell locked out overhead
4. Lift your hips off the floor (bridge position), then sweep the straight leg underneath you into a half-kneeling position
5. Stand up fully, then reverse every step in reverse order to return to the starting position on the floor
Key cues: Keep your eyes on the kettlebell throughout, move slowly and deliberately through each of the 7 steps, this is a full-body stability and mobility exercise — start with no weight until you master the movement pattern',
  NULL,
  ARRAY['full body']::text[],
  '{}'::text[]
);

COMMIT;
