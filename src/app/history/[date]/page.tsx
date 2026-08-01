import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Workout } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import TodayClient from "@/components/TodayClient";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HistoryDatePage({
  params,
}: {
  params: { date: string };
}) {
  if (!DATE_RE.test(params.date)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: workoutsData } = await supabase
    .from("workouts")
    .select("*, exercises(*, sets(*))")
    .eq("user_id", user.id)
    .eq("workout_date", params.date)
    .order("created_at", { ascending: false });

  const workouts: Workout[] = (workoutsData ?? []).map((w) => ({
    ...w,
    exercises: (w.exercises ?? [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((e: { sets: { set_number: number }[] }) => ({
        ...e,
        sets: (e.sets ?? []).sort(
          (a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number
        ),
      })),
  }));

  const formattedDate = new Date(`${params.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <BottomNav />
      <header className="app-container pb-2 pt-6 md:pt-8">
        <Link
          href="/history"
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> History
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">{formattedDate}</h1>
      </header>

      {workouts.length === 0 ? (
        <div className="app-container pt-4">
          <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
            <p className="text-white">Nothing logged on this day.</p>
          </div>
        </div>
      ) : (
        <TodayClient userId={user.id} initialWorkouts={workouts} todayDate={params.date} />
      )}
    </div>
  );
}
