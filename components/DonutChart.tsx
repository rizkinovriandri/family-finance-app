import type { CategorySlice } from "@/lib/supabase/queries/transactions";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DonutChart({
  slices,
  total,
  budgetTarget,
  centerPercentage,
}: {
  slices: CategorySlice[];
  total: number;
  budgetTarget?: number;
  // Override konten tengah donut jadi "58% Terpakai" (mis. halaman Budget)
  // alih-alih nominal rupiah (default, dipakai Dashboard).
  centerPercentage?: number;
}) {
  const stops = slices.reduce<{ cursor: number; parts: string[] }>(
    (acc, s) => {
      const from = acc.cursor;
      const to = from + s.percentage;
      acc.parts.push(`${s.color} ${from}% ${to}%`);
      return { cursor: to, parts: acc.parts };
    },
    { cursor: 0, parts: [] }
  ).parts;
  const gradient =
    stops.length > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(var(--color-border-subtle) 0% 100%)";

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative w-28 h-28 rounded-full shrink-0"
        style={{ background: gradient }}
      >
        <div className="absolute inset-3 rounded-full bg-bg-surface flex flex-col items-center justify-center text-center px-1.5">
          {centerPercentage !== undefined ? (
            <>
              <span className="text-lg font-bold text-text-primary leading-tight">
                {centerPercentage}%
              </span>
              <span className="text-[10px] text-text-muted leading-tight mt-0.5">Terpakai</span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-text-primary leading-tight">
                {formatRupiah(total)}
              </span>
              {budgetTarget ? (
                <span className="text-[10px] text-text-muted leading-tight mt-0.5">
                  dari {formatRupiah(budgetTarget)}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {slices.map((s) => (
          <div key={s.categoryId} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-text-secondary flex-1 truncate">
              {s.categoryName}
            </span>
            <span className="text-text-primary font-medium">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
