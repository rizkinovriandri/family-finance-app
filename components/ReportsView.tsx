"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getReportSummary, type ReportSummary } from "@/lib/supabase/queries/reports";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryFilterDropdown } from "@/components/CategoryFilterDropdown";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import type { Category } from "@/lib/supabase/queries/categories";
import { formatCycleLabel, shiftCycle } from "@/lib/utils/date";
import { formatCompactRupiah, getYAxisTicks } from "@/lib/utils/chart";

type Tab = "Pengeluaran" | "Pemasukan" | "Net Worth";
type ReportTab = Extract<Tab, "Pengeluaran" | "Pemasukan">;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Pengeluaran turun = bagus (hijau); pemasukan naik = bagus (hijau).
// Kebalikannya (pengeluaran naik / pemasukan turun) = kurang bagus (merah).
function isChangeFavorable(tab: ReportTab, changePercentage: number) {
  return tab === "Pengeluaran" ? changePercentage < 0 : changePercentage > 0;
}


export function ReportsView({
  familyId,
  monthStartDay,
  initialSummary,
  initialMonth,
  categories,
}: {
  familyId: string;
  monthStartDay: number;
  initialSummary: ReportSummary;
  initialMonth: string;
  categories: Category[];
}) {
  const [tab, setTab] = useState<Tab>("Pengeluaran");
  const [monthDate, setMonthDate] = useState(new Date(initialMonth + "T00:00:00"));
  const [summary, setSummary] = useState(initialSummary);
  const [categoryFilter, setCategoryFilter] = useState("");

  const monthLabel = formatCycleLabel(monthDate, monthStartDay);

  const tabCategories = useMemo(() => {
    const categoryType = tab === "Pemasukan" ? "income" : "expense";
    return categories.filter((c) => c.type === categoryType);
  }, [categories, tab]);

  async function load(date: Date, reportTab: ReportTab, categoryId: string) {
    const supabase = createClient();
    setSummary(
      await getReportSummary(
        supabase,
        familyId,
        date,
        monthStartDay,
        reportTab,
        categoryId || undefined
      )
    );
  }

  useRealtimeTable("transactions", familyId, () => {
    if (tab !== "Net Worth") load(monthDate, tab, categoryFilter);
  });

  function shiftMonth(delta: number) {
    const next = shiftCycle(monthDate, delta);
    setMonthDate(next);
    if (tab !== "Net Worth") load(next, tab, categoryFilter);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setCategoryFilter("");
    if (t !== "Net Worth") load(monthDate, t, "");
  }

  function changeCategoryFilter(categoryId: string) {
    setCategoryFilter(categoryId);
    if (tab !== "Net Worth") load(monthDate, tab, categoryId);
  }

  const maxWeekly = Math.max(1, ...summary.weekly.map((w) => w.amount));
  const { chartMax, ticks: yTicks } = getYAxisTicks(maxWeekly);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h1 className="text-2xl font-semibold text-text-primary">Laporan</h1>

      <div className="flex rounded-xl bg-bg-surface border border-border-subtle p-1">
        {(["Pengeluaran", "Pemasukan", "Net Worth"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${
              tab === t ? "bg-accent text-white" : "text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Net Worth" ? (
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6 text-center">
          <p className="text-sm text-text-secondary">
            Kekayaan bersih (net worth) belum tersedia — direncanakan hadir di fase
            pengembangan berikutnya.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl bg-bg-surface border border-border-subtle px-3 py-2">
            <button
              onClick={() => shiftMonth(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-text-primary">{monthLabel}</span>
            <button
              onClick={() => shiftMonth(1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
              aria-label="Bulan berikutnya"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-text-secondary">Total {tab}</p>
              <CategoryFilterDropdown
                categories={tabCategories}
                value={categoryFilter}
                onChange={changeCategoryFilter}
              />
            </div>
            <div className="flex items-end justify-between mt-1 gap-2">
              <span className="text-2xl font-bold text-text-primary">
                {formatRupiah(summary.total)}
              </span>
              {summary.changePercentage !== 0 && (
                <span
                  className={`text-xs font-medium flex items-center gap-1 shrink-0 ${
                    isChangeFavorable(tab, summary.changePercentage)
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {summary.changePercentage < 0 ? "↓" : "↑"}{" "}
                  {Math.abs(summary.changePercentage)}%
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">vs. bulan lalu</p>

            <div className="mt-4">
              <div className="flex gap-2 h-24">
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
                  <div className="relative h-full flex items-end justify-between gap-3">
                    {summary.weekly.map((w) => (
                      <div
                        key={w.weekLabel}
                        className="flex-1 flex items-end justify-center h-full"
                      >
                        <div
                          className={`w-5 rounded-t min-h-[2px] ${
                            tab === "Pemasukan" ? "bg-success" : "bg-accent"
                          }`}
                          style={{ height: `${(w.amount / chartMax) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-1.5">
                <div className="w-9 shrink-0" />
                <div className="flex-1 flex justify-between gap-3">
                  {summary.weekly.map((w) => (
                    <span
                      key={w.weekLabel}
                      className="flex-1 text-center text-[10px] text-text-muted"
                    >
                      {w.weekLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
            <p className="text-sm font-medium text-text-primary mb-3">Kategori Terbesar</p>
            {summary.categories.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Belum ada data bulan ini.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {summary.categories.map((c, i) => (
                  <div key={c.categoryId} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-text-muted font-medium shrink-0">
                      {i + 1}
                    </span>
                    <CategoryIcon name={c.categoryName} icon={c.categoryIcon} />
                    <p className="flex-1 min-w-0 text-sm text-text-primary truncate">
                      {c.categoryName}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-text-primary">
                        {formatRupiah(c.amount)}
                      </p>
                      <p className="text-xs text-text-muted">{c.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
