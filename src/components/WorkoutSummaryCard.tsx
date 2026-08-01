import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { categoryLabel } from "@/lib/categories";

export type WorkoutSummary = {
  id: string;
  workout_date: string;
  category: string;
  is_completed: boolean;
  exerciseCount: number;
  setCount: number;
};

export default function WorkoutSummaryCard({ workout }: { workout: WorkoutSummary }) {
  return (
    <Link
      href={`/history/${workout.workout_date}`}
      className="card flex items-center justify-between gap-3 px-4 py-4 transition hover:border-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="badge">{categoryLabel(workout.category)}</span>
        {workout.is_completed && (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Completed" />
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>
          {workout.exerciseCount} exercise{workout.exerciseCount === 1 ? "" : "s"} ·{" "}
          {workout.setCount} set{workout.setCount === 1 ? "" : "s"}
        </span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
