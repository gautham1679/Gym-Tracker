"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, ChevronDown, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Workout } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { exerciseNameSchema } from "@/lib/validation";
import ExerciseTable from "./ExerciseTable";

type Props = {
  workout: Workout;
  editable: boolean;
  onAddExercise: (name: string) => Promise<void> | void;
  onAddSet: (exerciseId: string, reps: number, weightKg: number) => Promise<void> | void;
  onToggleSetComplete: (
    exerciseId: string,
    setId: string,
    completed: boolean
  ) => Promise<void> | void;
  onDeleteSet: (exerciseId: string, setId: string) => Promise<void> | void;
  onDeleteExercise: (exerciseId: string) => Promise<void> | void;
  onToggleComplete: () => Promise<void> | void;
  onDeleteWorkout: () => Promise<void> | void;
  onManageExercises: () => void;
};

export default function WorkoutCard({
  workout,
  editable,
  onAddExercise,
  onAddSet,
  onToggleSetComplete,
  onDeleteSet,
  onDeleteExercise,
  onToggleComplete,
  onDeleteWorkout,
  onManageExercises,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAddExercise(e: FormEvent) {
    e.preventDefault();
    const result = exerciseNameSchema.safeParse(exerciseName);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter an exercise name");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onAddExercise(result.data);
      setExerciseName("");
      setShowAddExercise(false);
    } catch {
      setError("Couldn't add that exercise. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight_kg, 0),
    0
  );

  return (
    <div className="card overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="badge">{categoryLabel(workout.category)}</span>
          {editable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageExercises();
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-accent"
              aria-label={`Manage ${categoryLabel(workout.category)} exercise list`}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          )}
          {workout.is_completed && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="text-right">
            {workout.exercises.length} exercise{workout.exercises.length === 1 ? "" : "s"} ·{" "}
            {totalSets} set{totalSets === 1 ? "" : "s"}
            {totalVolume > 0 && (
              <>
                <br />
                <span className="text-xs">{totalVolume.toLocaleString()} kg total volume</span>
              </>
            )}
          </span>
          <ChevronDown
            className={clsx("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
        </div>
      </div>

      {expanded && (
        <div>
          {workout.exercises.map((exercise) => (
            <ExerciseTable
              key={exercise.id}
              exercise={exercise}
              editable={editable}
              onAddSet={(reps, weight) => onAddSet(exercise.id, reps, weight)}
              onToggleSetComplete={(setId, completed) =>
                onToggleSetComplete(exercise.id, setId, completed)
              }
              onDeleteSet={(setId) => onDeleteSet(exercise.id, setId)}
              onDeleteExercise={() => onDeleteExercise(exercise.id)}
            />
          ))}

          {editable && (
            <div className="border-t border-border p-4">
              {showAddExercise ? (
                <form onSubmit={handleAddExercise} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. Bench Press"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      className="field-input flex-1"
                    />
                    <button type="submit" disabled={saving} className="btn-primary px-4">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </button>
                  </div>
                  {error && <p className="field-error">{error}</p>}
                </form>
              ) : (
                <button
                  onClick={() => setShowAddExercise(true)}
                  className="btn-secondary w-full"
                >
                  <Plus className="h-4 w-4" /> Add exercise
                </button>
              )}
            </div>
          )}

          {editable && (
            <div className="flex items-center gap-2 border-t border-border p-4">
              <button onClick={() => onToggleComplete()} className="btn-secondary flex-1">
                {workout.is_completed ? "Mark as in progress" : "Finish workout"}
              </button>
              <button
                onClick={() => onDeleteWorkout()}
                className="rounded-xl p-3 text-muted hover:bg-surface2 hover:text-red-400"
                aria-label="Delete workout"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
