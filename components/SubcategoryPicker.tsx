import type { Subcategory } from "@/lib/supabase/queries/subcategories";

export function SubcategoryPicker({
  subcategories,
  value,
  onChange,
}: {
  subcategories: Subcategory[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (subcategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-full px-3 py-2 text-xs border ${
          value === ""
            ? "border-accent bg-accent/10 text-text-primary"
            : "border-border-subtle text-text-secondary"
        }`}
      >
        Tanpa sub kategori
      </button>
      {subcategories.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`rounded-full px-3 py-2 text-xs border ${
              active
                ? "border-accent bg-accent/10 text-text-primary"
                : "border-border-subtle text-text-secondary"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
