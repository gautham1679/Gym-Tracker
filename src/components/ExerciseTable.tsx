"use client";

import { useState, type FormEvent } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Exercise } from "@/lib/types";
import { setInputSchema, parseNumericInput } from "@/lib/validation";

type Props = {
  exercise: Exercise;
  editable: boolean;
  onAddSet: (reps: number, weightKg: number) => Promise<void> | void;
  onToggleSetComplete: (setId: string, completed: boolean) => Promise<void> | void;
  onDeleteSet: (setId: string) => Promise<void> | void;
  onDeleteExercise: () => Promise<void> | void;
};

export default function ExerciseTable({
  exercise,
  editable,
  onAddSet,
  onToggleSetComplete,
  onDeleteSet,
  onDeleteExercise,
}: Props) {
  const [repsInput, setRepsInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAddSet(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const reps = parseNumericInput(repsInput);
    const weight_kg = parseNumericInput(weightInput);

    const result = setInputSchema.safeParse({
      reps: reps ?? NaN,
      weight_kg: weight_kg ?? NaN,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter reps and weight");
      return;
    }

    setSaving(true);
    try {
      await onAddSet(result.data.reps, result.data.weight_kg);
      setRepsInput("");
      setWeightInput("");
    } catch {
      setError("Couldn't save that set. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-border first:border-t-0">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="font-semibold text-white">{exercise.name}</h3>
        {editable && (
          <button
            onClick={() => onDeleteExercise()}
            className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-red-400"
            aria-label={`Remove ${exercise.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Set</span>
          <span>Reps</span>
          <span>Kg</span>
          <span className="text-center">✓</span>
        </div>

        <div className="space-y-1.5">
          {exercise.sets.length === 0 && (
            <p className="py-2 text-sm text-muted">No sets logged yet.</p>
          )}
          {exercise.sets.map((set) => (
            <div
              key={set.id}
              className="group grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 rounded-xl bg-surface2 px-0 py-2"
            >
              <span className="text-center text-sm font-semibold text-muted">
                {set.set_number}
              </span>
              <span className="text-sm font-medium text-white">{set.reps}</span>
              <span className="text-sm font-medium text-white">{set.weight_kg}</span>
              <div className="flex items-center justify-center gap-1">
                <button
                  disabled={!editable}
                  onClick={() => onToggleSetComplete(set.id, !set.completed)}
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-full border transition",
                    set.completed
                      ? "border-accent bg-accent text-black"
                      : "border-border bg-transparent text-transparent hover:border-muted",
                    !editable && "cursor-default"
                  )}
                  aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editable && (
          <form onSubmit={handleAddSet} className="mt-2">
            <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2">
              <span className="text-center text-sm font-semibold text-muted">
                {exercise.sets.length + 1}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Reps"
                value={repsInput}
                onChange={(e) => setRepsInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                placeholder="Kg"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black transition hover:bg-accent-hover disabled:opacity-50"
                aria-label="Add set"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            {error && <p className="field-error">{error}</p>}
          </form>
        )}

        {exercise.sets.length > 0 && editable && (
          <button
            onClick={() => onDeleteSet(exercise.sets[exercise.sets.length - 1].id)}
            className="mt-2 text-xs font-medium text-muted hover:text-red-400"
          >
            Remove last set
          </button>
        )}
      </div>
    </div>
  );
}
