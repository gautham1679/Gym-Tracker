export type SetRow = {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
  created_at: string;
};

export type Exercise = {
  id: string;
  workout_id: string;
  name: string;
  position: number;
  created_at: string;
  sets: SetRow[];
};

export type Workout = {
  id: string;
  user_id: string;
  workout_date: string; // YYYY-MM-DD
  category: string;
  name: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  exercises: Exercise[];
};

/** Raw shape as it comes back from Supabase before we nest/sort it client-side. */
export type WorkoutRow = Omit<Workout, "exercises">;
export type ExerciseRow = Omit<Exercise, "sets">;
