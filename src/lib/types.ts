export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type LogMode = 'quick' | 'detailed';

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'other';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'legs'
  | 'glutes'
  | 'calves'
  | 'full_body';

export type EquipmentType =
  | 'bodyweight'
  | 'barbell'
  | 'dumbbells'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'resistance_band'
  | 'pull_up_bar'
  | 'bench'
  | 'cardio_machine'
  | 'jump_rope'
  | 'battle_ropes'
  | 'foam_roller'
  | 'plyo_box'
  | 'pool'
  | 'none';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  category: ExerciseCategory;
  muscle_groups: MuscleGroup[];
  primary_muscles: MuscleGroup[];
  secondary_muscles: MuscleGroup[];
  equipment: EquipmentType[];
  difficulty: Difficulty;
  instructions: string | null;
  demo_url: string | null;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  difficulty: Difficulty;
  workout_type: WorkoutType;
  created_by: string;
  group_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: string | null;
  target_duration: number | null;
  notes: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  plan_id: string | null;
  group_id: string | null;
  workout_type: WorkoutType;
  log_mode: LogMode;
  name: string;
  notes: string | null;
  duration_minutes: number | null;
  completed_at: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  workout_id: string;
  emoji: string;
  created_at: string;
}
