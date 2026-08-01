"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/categories";
import { exerciseNameSchema } from "@/lib/validation";
import type { ExerciseTemplate } from "@/lib/types";

export default function ManageExercisesModal({
  userId,
  category,
  onClose,
}: {
  userId: string;
  category: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("exercise_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setTemplates(data ?? []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, category]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const result = exerciseNameSchema.safeParse(name);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter an exercise name");
      return;
    }
    if (templates.some((t) => t.name.toLowerCase() === result.data.toLowerCase())) {
      setError("That's already on the list");
      return;
    }

    setError(null);
    setSaving(true);
    const { data, error: dbError } = await supabase
      .from("exercise_templates")
      .insert({ user_id: userId, category, name: result.data })
      .select()
      .single();
    setSaving(false);

    if (dbError || !data) {
      setError("Couldn't save that. Try again.");
      return;
    }

    setTemplates((prev) => [...prev, data]);
    setName("");
  }

  async function handleDelete(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("exercise_templates").delete().eq("id", id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-8 shadow-card md:rounded-3xl md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {categoryLabel(category)} exercises
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface2 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          {"These show up automatically every time you start a " +
            categoryLabel(category) +
            " workout. Removing one here only affects future days — past history is untouched."}
        </p>

        <div className="mb-4 max-h-64 space-y-1.5 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          )}
          {!loading && templates.length === 0 && (
            <p className="py-2 text-sm text-muted">No saved exercises yet — add one below.</p>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5"
            >
              <span className="text-sm font-medium text-white">{t.name}</span>
              <button
                onClick={() => handleDelete(t.id)}
                className="rounded-lg p-1 text-muted hover:text-red-400"
                aria-label={`Remove ${t.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Incline Press"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input flex-1"
          />
          <button type="submit" disabled={saving} className="btn-primary px-4">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </form>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
