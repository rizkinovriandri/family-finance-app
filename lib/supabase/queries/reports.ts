import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionType } from "@/lib/types/database";
import { BALANCE_ADJUSTMENT_CATEGORY_NAME, getCategoryStyle } from "@/lib/constants/enums";
import { getCycleRange, getCycleStart, shiftCycle } from "@/lib/utils/date";

type Client = SupabaseClient<Database>;

export interface WeeklyPoint {
  weekLabel: string;
  amount: number;
}

export interface ReportCategorySlice {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  amount: number;
  percentage: number;
  color: string;
}

export interface ReportSummary {
  total: number;
  changePercentage: number;
  weekly: WeeklyPoint[];
  categories: ReportCategorySlice[];
}

export async function getReportSummary(
  supabase: Client,
  familyId: string,
  monthDate: Date,
  monthStartDay: number,
  type: Extract<TransactionType, "Pemasukan" | "Pengeluaran">,
  categoryId?: string
): Promise<ReportSummary> {
  const cycleStart = getCycleStart(monthDate, monthStartDay);
  const { start, end } = getCycleRange(cycleStart, monthStartDay);
  const prevCycleStart = shiftCycle(cycleStart, -1);
  const { start: prevStart } = getCycleRange(prevCycleStart, monthStartDay);

  const [{ data: transactions, error }, { data: categories, error: catError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("date, type, amount, category_id, transfer_pair_id")
        .eq("family_id", familyId)
        .gte("date", prevStart)
        .lt("date", end),
      supabase.from("categories").select("id, name, icon"),
    ]);

  if (error) throw error;
  if (catError) throw catError;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const adjustmentCategoryIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  let total = 0;
  let previousTotal = 0;
  const byCategory = new Map<string, number>();
  // Split siklus bulan berjalan jadi 4 "minggu" tetap (hari ke 1-7, 8-14,
  // 15-21, 22-akhir DIHITUNG SEJAK AWAL SIKLUS, bukan tanggal kalender) —
  // pendekatan sederhana meniru tampilan W1-W4 di mockup, bukan minggu
  // kalender ISO sungguhan.
  const weeklyBuckets = [0, 0, 0, 0];
  const msPerDay = 24 * 60 * 60 * 1000;

  for (const t of transactions) {
    // Transfer antar akun dan penyesuaian saldo bukan pemasukan/pengeluaran
    // sungguhan — lihat catatan serupa di getMonthlySummary.
    if (t.transfer_pair_id) continue;
    if (adjustmentCategoryIds.has(t.category_id)) continue;
    if (t.type !== type) continue;
    if (categoryId && t.category_id !== categoryId) continue;

    const isCurrentMonth = t.date >= start && t.date < end;
    if (isCurrentMonth) {
      total += t.amount;
      byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount);
      const txDate = new Date(t.date + "T00:00:00");
      const daysSinceCycleStart = Math.round((txDate.getTime() - cycleStart.getTime()) / msPerDay);
      const weekIndex = Math.min(3, Math.floor(daysSinceCycleStart / 7));
      weeklyBuckets[weekIndex] += t.amount;
    } else {
      previousTotal += t.amount;
    }
  }

  const changePercentage =
    previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : total > 0
        ? 100
        : 0;

  const categories_ = Array.from(byCategory.entries())
    .map(([categoryId, amount]) => {
      const cat = categoryById.get(categoryId);
      const categoryName = cat?.name ?? "Lainnya";
      return {
        categoryId,
        categoryName,
        categoryIcon: cat?.icon ?? null,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: getCategoryStyle(categoryName).bright,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const weekly = weeklyBuckets.map((amount, i) => ({ weekLabel: `W${i + 1}`, amount }));

  return { total, changePercentage, weekly, categories: categories_ };
}
