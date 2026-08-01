import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count: workoutCount } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <BottomNav />
      <TopBar title="Profile" />

      <div className="app-container space-y-4 pt-4">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted">
            <User className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-white">{user.email}</p>
            {joined && <p className="text-sm text-muted">Member since {joined}</p>}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm text-muted">Total workouts logged</p>
          <p className="mt-1 text-3xl font-bold text-white">{workoutCount ?? 0}</p>
        </div>

        <SignOutButton />
      </div>
    </div>
  );
}
