import type { MonthlyTrendPoint } from "@/lib/supabase/queries/transactions";

export function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));

  return (
    <div className="flex items-end justify-between gap-2 h-28">
      {data.map((d) => (
        <div key={d.monthLabel} className="flex-1 flex flex-col items-center gap-1.5 h-full">
          <div className="flex items-end gap-1 flex-1">
            <div
              className="w-2.5 rounded-t bg-success min-h-[2px]"
              style={{ height: `${(d.income / max) * 100}%` }}
            />
            <div
              className="w-2.5 rounded-t bg-danger min-h-[2px]"
              style={{ height: `${(d.expense / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted">{d.monthLabel}</span>
        </div>
      ))}
    </div>
  );
}
