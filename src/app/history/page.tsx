import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import WorkoutSummaryCard, { type WorkoutSummary } from "@/components/WorkoutSummaryCard";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  workout_date: string;
  category: string;
  is_completed: boolean;
  exercises: { id: string; sets: { id: string }[] }[];
};

export default async function HistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("workouts")
    .select("id, workout_date, category, is_completed, exercises(id, sets(id))")
    .eq("user_id", user.id)
    .order("workout_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  const summaries: WorkoutSummary[] = rows.map((w) => ({
    id: w.id,
    workout_date: w.workout_date,
    category: w.category,
    is_completed: w.is_completed,
    exerciseCount: w.exercises?.length ?? 0,
    setCount: w.exercises?.reduce((sum, e) => sum + (e.sets?.length ?? 0), 0) ?? 0,
  }));

  const grouped = new Map<string, WorkoutSummary[]>();
  for (const s of summaries) {
    const list = grouped.get(s.workout_date) ?? [];
    list.push(s);
    grouped.set(s.workout_date, list);
  }

  const dates = Array.from(grouped.keys());

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <BottomNav />
      <TopBar title="History" subtitle="Every workout you've logged" />

      <div className="app-container space-y-6 pb-12 pt-4">
        {dates.length === 0 && (
          <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
            <p className="text-white">No workouts logged yet.</p>
            <p className="text-sm text-muted">
              Head to Today to start your first session.
            </p>
          </div>
        )}

        {dates.map((date) => (
          <section key={date}>
            <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted">
              {formatDateHeading(date)}
            </h2>
            <div className="space-y-2">
              {grouped.get(date)!.map((w) => (
                <WorkoutSummaryCard key={w.id} workout={w} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function formatDateHeading(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}
