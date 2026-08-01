"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, Workout } from "@/lib/types";
import WorkoutCard from "./WorkoutCard";
import CategoryPickerModal from "./CategoryPickerModal";
import ManageExercisesModal from "./ManageExercisesModal";

export default function TodayClient({
  userId,
  initialWorkouts,
  todayDate,
}: {
  userId: string;
  initialWorkouts: Workout[];
  todayDate: string;
}) {
  const supabase = createClient();
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [showPicker, setShowPicker] = useState(false);
  const [manageCategory, setManageCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateWorkout(id: string, updater: (w: Workout) => Workout) {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? updater(w) : w)));
  }

  async function handleCreateWorkout(category: string) {
    setShowPicker(false);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("workouts")
      .insert({ user_id: userId, workout_date: todayDate, category })
      .select()
      .single();

    if (dbError || !data) {
      setError("Couldn't start that workout. Try again.");
      return;
    }

    // Pre-fill exercises from this category's saved list, if there is one.
    let exercises: Exercise[] = [];
    const { data: templates } = await supabase
      .from("exercise_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("created_at", { ascending: true });

    if (templates && templates.length > 0) {
      const { data: newExercises } = await supabase
        .from("exercises")
        .insert(
          templates.map((t, i) => ({
            workout_id: data.id,
            name: t.name,
            position: i,
          }))
        )
        .select();

      if (newExercises) {
        exercises = newExercises.map((e) => ({ ...e, sets: [] }));
      }
    }

    setWorkouts((prev) => [{ ...data, exercises }, ...prev]);
  }

  async function handleAddExercise(workoutId: string, name: string) {
    const workout = workouts.find((w) => w.id === workoutId);
    const position = workout ? workout.exercises.length : 0;

    const { data, error: dbError } = await supabase
      .from("exercises")
      .insert({ workout_id: workoutId, name, position })
      .select()
      .single();

    if (dbError || !data) throw dbError ?? new Error("Insert failed");

    updateWorkout(workoutId, (w) => ({
      ...w,
      exercises: [...w.exercises, { ...data, sets: [] }],
    }));

    // Remember this exercise for the category going forward. If it's
    // already saved, this is a no-op (unique constraint + ignoreDuplicates).
    if (workout) {
      await supabase
        .from("exercise_templates")
        .upsert(
          { user_id: userId, category: workout.category, name },
          { onConflict: "user_id,category,name", ignoreDuplicates: true }
        );
    }
  }

  async function handleAddSet(
    workoutId: string,
    exerciseId: string,
    reps: number,
    weightKg: number
  ) {
    const workout = workouts.find((w) => w.id === workoutId);
    const exercise = workout?.exercises.find((e) => e.id === exerciseId);
    const setNumber = (exercise?.sets.length ?? 0) + 1;

    const { data, error: dbError } = await supabase
      .from("sets")
      .insert({
        exercise_id: exerciseId,
        set_number: setNumber,
        reps,
        weight_kg: weightKg,
      })
      .select()
      .single();

    if (dbError || !data) throw dbError ?? new Error("Insert failed");

    updateWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exerciseId ? { ...e, sets: [...e.sets, data] } : e
      ),
    }));
  }

  async function handleToggleSetComplete(
    workoutId: string,
    exerciseId: string,
    setId: string,
    completed: boolean
  ) {
    updateWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, completed } : s)) }
          : e
      ),
    }));

    const { error: dbError } = await supabase
      .from("sets")
      .update({ completed })
      .eq("id", setId);

    if (dbError) {
      updateWorkout(workoutId, (w) => ({
        ...w,
        exercises: w.exercises.map((e) =>
          e.id === exerciseId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, completed: !completed } : s)) }
            : e
        ),
      }));
      setError("Couldn't update that set.");
    }
  }

  async function handleDeleteSet(workoutId: string, exerciseId: string, setId: string) {
    const { error: dbError } = await supabase.from("sets").delete().eq("id", setId);
    if (dbError) {
      setError("Couldn't remove that set.");
      return;
    }
    updateWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      ),
    }));
  }

  async function handleDeleteExercise(workoutId: string, exerciseId: string) {
    const { error: dbError } = await supabase.from("exercises").delete().eq("id", exerciseId);
    if (dbError) {
      setError("Couldn't remove that exercise.");
      return;
    }
    updateWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.filter((e) => e.id !== exerciseId),
    }));
  }

  async function handleToggleComplete(workoutId: string) {
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;
    const next = !workout.is_completed;

    updateWorkout(workoutId, (w) => ({ ...w, is_completed: next }));

    const { error: dbError } = await supabase
      .from("workouts")
      .update({ is_completed: next })
      .eq("id", workoutId);

    if (dbError) {
      updateWorkout(workoutId, (w) => ({ ...w, is_completed: !next }));
      setError("Couldn't update workout status.");
    }
  }

  async function handleDeleteWorkout(workoutId: string) {
    if (!confirm("Delete this workout and all its exercises? This can't be undone.")) return;

    const { error: dbError } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (dbError) {
      setError("Couldn't delete that workout.");
      return;
    }
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  }

  return (
    <div className="app-container pb-28 pt-4 md:pb-12">
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {workouts.length === 0 && (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-white">No workout logged yet today.</p>
            <p className="text-sm text-muted">Start one below to begin tracking sets.</p>
          </div>
        )}

        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            editable
            onAddExercise={(name) => handleAddExercise(workout.id, name)}
            onAddSet={(exerciseId, reps, weight) =>
              handleAddSet(workout.id, exerciseId, reps, weight)
            }
            onToggleSetComplete={(exerciseId, setId, completed) =>
              handleToggleSetComplete(workout.id, exerciseId, setId, completed)
            }
            onDeleteSet={(exerciseId, setId) => handleDeleteSet(workout.id, exerciseId, setId)}
            onDeleteExercise={(exerciseId) => handleDeleteExercise(workout.id, exerciseId)}
            onToggleComplete={() => handleToggleComplete(workout.id)}
            onDeleteWorkout={() => handleDeleteWorkout(workout.id)}
            onManageExercises={() => setManageCategory(workout.category)}
          />
        ))}

        <button
          onClick={() => setShowPicker(true)}
          className="btn-primary w-full py-4"
        >
          <Plus className="h-5 w-5" /> Start new workout
        </button>
      </div>

      {showPicker && (
        <CategoryPickerModal
          onSelect={handleCreateWorkout}
          onClose={() => setShowPicker(false)}
        />
      )}

      {manageCategory && (
        <ManageExercisesModal
          userId={userId}
          category={manageCategory}
          onClose={() => setManageCategory(null)}
        />
      )}
    </div>
  );
}
