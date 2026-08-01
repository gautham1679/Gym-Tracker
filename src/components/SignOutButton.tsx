"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={() => setLoading(true)}
    >
      <button type="submit" disabled={loading} className="btn-secondary w-full">
        <LogOut className="h-4 w-4" />
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </form>
  );
}
