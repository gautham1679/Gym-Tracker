"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, User } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: Dumbbell },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:sticky md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="app-container flex items-center justify-around py-2 md:justify-start md:gap-2 md:py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium transition md:flex-row md:gap-2 md:px-4 md:py-2 md:text-sm",
                active ? "text-accent" : "text-muted hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
