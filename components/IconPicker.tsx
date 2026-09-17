"use client";

import { CATEGORY_ICON_OPTIONS } from "@/lib/constants/category-icons";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`aspect-square rounded-xl flex items-center justify-center border ${
              active
                ? "border-accent bg-accent/15 text-accent"
                : "border-border-subtle text-text-secondary"
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
