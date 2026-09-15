import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getCategoryStyle } from "@/lib/constants/enums";

type Client = SupabaseClient<Database>;

export interface CategorySlice {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  categories: CategorySlice[];
}

function monthRange(monthStart: Date) {
  const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

export async function getMonthlySummary(
  supabase: Client,
  familyId: string,
  monthStart: Date = new Date()
): Promise<MonthlySummary> {
  const { start, end } = monthRange(monthStart);

  const [{ data: transactions, error: txError }, { data: categories, error: catError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount, category_id")
        .eq("family_id", familyId)
        .gte("date", start)
        .lt("date", end),
      supabase.from("categories").select("id, name"),
    ]);

  if (txError) throw txError;
  if (catError) throw catError;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === "Pemasukan") {
      totalIncome += t.amount;
    } else if (t.type === "Pengeluaran") {
      totalExpense += t.amount;
      expenseByCategory.set(
        t.category_id,
        (expenseByCategory.get(t.category_id) ?? 0) + t.amount
      );
    }
  }

  const categorySlices: CategorySlice[] = Array.from(expenseByCategory.entries())
    .map(([categoryId, amount]) => {
      const categoryName = categoryNameById.get(categoryId) ?? "Lainnya";
      return {
        categoryId,
        categoryName,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color: getCategoryStyle(categoryName).bright,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { totalIncome, totalExpense, categories: categorySlices };
}
