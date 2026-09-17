"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ChevronRightIcon, GridIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/queries/categories";

export function CategoryFilterDropdown({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((c) => c.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function select(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl bg-bg-page border border-border-subtle px-3 py-2 text-sm text-text-primary"
      >
        {selected ? (
          <CategoryIcon name={selected.name} icon={selected.icon} variant="chip" />
        ) : (
          <span className="w-5 h-5 rounded-full bg-bg-surface text-text-secondary flex items-center justify-center shrink-0">
            <GridIcon className="w-3 h-3" />
          </span>
        )}
        <span className="truncate max-w-[9rem]">
          {selected ? selected.name : "Semua Kategori"}
        </span>
        <ChevronRightIcon
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1.5 w-56 max-h-72 overflow-y-auto rounded-xl bg-bg-surface border border-border-subtle p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => select("")}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left ${
              value === "" ? "bg-accent/15 text-accent" : "text-text-primary"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-bg-page text-text-secondary flex items-center justify-center shrink-0">
              <GridIcon className="w-3 h-3" />
            </span>
            Semua Kategori
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left ${
                value === c.id ? "bg-accent/15 text-accent" : "text-text-primary"
              }`}
            >
              <CategoryIcon name={c.name} icon={c.icon} variant="chip" />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
