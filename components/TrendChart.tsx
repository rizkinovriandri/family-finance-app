import type { MonthlyTrendPoint } from "@/lib/supabase/queries/transactions";
import { formatCompactRupiah, getYAxisTicks } from "@/lib/utils/chart";

export function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const { chartMax, ticks: yTicks } = getYAxisTicks(max);

  return (
    <div>
      <div className="flex gap-2 h-28">
        <div className="flex flex-col justify-between text-[10px] text-text-muted w-9 shrink-0 text-right">
          {yTicks.map((t, i) => (
            <span key={i}>{formatCompactRupiah(t)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {yTicks.map((t, i) => (
              <div key={i} className="border-t border-border-subtle" />
            ))}
          </div>
          <div className="relative h-full flex items-end justify-between gap-2">
            {data.map((d) => (
              <div key={d.monthLabel} className="flex-1 flex items-end justify-center h-full">
                <div className="flex items-end gap-1 h-full">
                  <div
                    className="w-2.5 rounded-t bg-success min-h-[2px]"
                    style={{ height: `${(d.income / chartMax) * 100}%` }}
                  />
                  <div
                    className="w-2.5 rounded-t bg-danger min-h-[2px]"
                    style={{ height: `${(d.expense / chartMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-1.5">
        <div className="w-9 shrink-0" />
        <div className="flex-1 flex justify-between gap-2">
          {data.map((d) => (
            <span
              key={d.monthLabel}
              className="flex-1 text-center text-[10px] text-text-muted"
            >
              {d.monthLabel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
