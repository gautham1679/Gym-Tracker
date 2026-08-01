import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Workout } from "@/lib/types";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import TodayClient from "@/components/TodayClient";

export const dynamic = "force-dynamic";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const todayDate = todayISODate();

  const { data: workoutsData } = await supabase
    .from("workouts")
    .select("*, exercises(*, sets(*))")
    .eq("user_id", user.id)
    .eq("workout_date", todayDate)
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

  const formattedDate = new Date(`${todayDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <BottomNav />
      <TopBar title="Today" subtitle={formattedDate} />
      <TodayClient userId={user.id} initialWorkouts={workouts} todayDate={todayDate} />
    </div>
  );
}
