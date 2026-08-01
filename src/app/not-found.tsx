import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted">
        <Dumbbell className="h-7 w-7 text-accent" />
      </div>
      <h1 className="text-xl font-bold text-white">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        {"The page you're looking for doesn't exist."}
      </p>
      <Link href="/today" className="btn-primary">
        Back to Today
      </Link>
    </div>
  );
}
