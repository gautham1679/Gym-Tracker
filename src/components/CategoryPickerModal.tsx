"use client";

import { X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-8 shadow-card md:rounded-3xl md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Start a workout</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface2 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">Pick a category to get started.</p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3.5 text-center font-medium text-white transition hover:border-accent hover:bg-accent-muted hover:text-accent"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
