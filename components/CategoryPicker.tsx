import { getCategoryStyle } from "@/lib/constants/enums";
import type { Category } from "@/lib/supabase/queries/categories";

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const style = getCategoryStyle(c.name);
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs border ${
              active
                ? "border-accent bg-accent/10 text-text-primary"
                : "border-border-subtle text-text-secondary"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: style.bright }}
            />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
