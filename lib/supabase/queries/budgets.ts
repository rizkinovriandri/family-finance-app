import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { BudgetFormValues } from "@/lib/validation/budget";
import { getCycleRange, getCycleStart, shiftCycle, toLocalISODate } from "@/lib/utils/date";

type Client = SupabaseClient<Database>;

export interface BudgetWithRealization {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  targetAmount: number;
  realisasi: number;
  percentage: number;
  status: "Aman" | "Waspada" | "Melebihi";
  notes: string | null;
}

export function statusFor(percentage: number): BudgetWithRealization["status"] {
  if (percentage > 100) return "Melebihi";
  if (percentage >= 80) return "Waspada";
  return "Aman";
}

export async function listBudgetsForMonth(
  supabase: Client,
  familyId: string,
  monthDate: Date,
  monthStartDay: number
): Promise<BudgetWithRealization[]> {
  const month = toLocalISODate(getCycleStart(monthDate, monthStartDay));

  const [
    { data: budgets, error: budgetError },
    { data: realizations, error: realizationError },
    { data: categories, error: catError },
    { data: subcategories, error: subError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("*")
      .eq("family_id", familyId)
      .eq("month", month),
    supabase
      .from("budget_realizations")
      .select("budget_id, realisasi")
      .eq("family_id", familyId)
      .eq("month", month),
    supabase.from("categories").select("id, name, icon"),
    supabase.from("subcategories").select("id, name").eq("family_id", familyId),
  ]);

  if (budgetError) throw budgetError;
  if (realizationError) throw realizationError;
  if (catError) throw catError;
  if (subError) throw subError;

  const realisasiByBudgetId = new Map(realizations.map((r) => [r.budget_id, r.realisasi]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));

  return budgets
    .map((b) => {
      const realisasi = realisasiByBudgetId.get(b.id) ?? 0;
      const percentage =
        b.target_amount > 0 ? Math.round((realisasi / b.target_amount) * 100) : 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: categoryById.get(b.category_id)?.name ?? "Lainnya",
        categoryIcon: categoryById.get(b.category_id)?.icon ?? null,
        subcategoryId: b.subcategory_id,
        subcategoryName: b.subcategory_id
          ? (subcategoryNameById.get(b.subcategory_id) ?? null)
          : null,
        targetAmount: b.target_amount,
        realisasi,
        percentage,
        status: statusFor(percentage),
        notes: b.notes,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export async function createBudget(
  supabase: Client,
  familyId: string,
  monthDate: Date,
  input: BudgetFormValues,
  monthStartDay: number
) {
  const { error } = await supabase.from("budgets").insert({
    family_id: familyId,
    month: toLocalISODate(getCycleStart(monthDate, monthStartDay)),
    category_id: input.category_id,
    subcategory_id: input.subcategory_id || null,
    target_amount: input.target_amount,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateBudget(
  supabase: Client,
  budgetId: string,
  input: Pick<BudgetFormValues, "target_amount" | "notes" | "subcategory_id">
) {
  const { error } = await supabase
    .from("budgets")
    .update({
      target_amount: input.target_amount,
      notes: input.notes || null,
      subcategory_id: input.subcategory_id || null,
    })
    .eq("id", budgetId);
  if (error) throw error;
}

export async function deleteBudget(supabase: Client, budgetId: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
  if (error) throw error;
}

export interface UnbudgetedExpense {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  accountName: string;
}

// Transaksi pengeluaran bulan ini yang kategori (atau kombinasi kategori +
// sub kategorinya) belum dibuatkan budget sama sekali — supaya kelihatan
// pengeluaran mana yang "lolos" dari anggaran yang sudah dibuat. Kategori
// tercakup kalau ada budget level kategori (subcategory_id null, roll-up
// semua sub kategori di dalamnya) ATAU budget spesifik untuk sub kategori
// transaksi itu — konsisten dengan logic realisasi di budget_realizations.
export async function listUnbudgetedExpenses(
  supabase: Client,
  familyId: string,
  monthDate: Date,
  monthStartDay: number
): Promise<UnbudgetedExpense[]> {
  const cycleStart = getCycleStart(monthDate, monthStartDay);
  const { start, end } = getCycleRange(cycleStart, monthStartDay);

  const [
    { data: budgets, error: budgetError },
    { data: transactions, error: txError },
    { data: categories, error: catError },
    { data: subcategories, error: subError },
    { data: accounts, error: accError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("category_id, subcategory_id")
      .eq("family_id", familyId)
      .eq("month", toLocalISODate(cycleStart)),
    supabase
      .from("transactions")
      .select("id, date, amount, description, category_id, subcategory_id, account_id")
      .eq("family_id", familyId)
      .eq("type", "Pengeluaran")
      .is("transfer_pair_id", null)
      .gte("date", start)
      .lt("date", end),
    supabase.from("categories").select("id, name, icon"),
    supabase.from("subcategories").select("id, name").eq("family_id", familyId),
    supabase.from("accounts").select("id, name").eq("family_id", familyId),
  ]);

  if (budgetError) throw budgetError;
  if (txError) throw txError;
  if (catError) throw catError;
  if (subError) throw subError;
  if (accError) throw accError;

  const categoryLevelBudgeted = new Set(
    budgets.filter((b) => b.subcategory_id === null).map((b) => b.category_id)
  );
  const subcategoryBudgeted = new Set(
    budgets
      .filter((b) => b.subcategory_id !== null)
      .map((b) => `${b.category_id}:${b.subcategory_id}`)
  );

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

  return transactions
    .filter((t) => {
      if (categoryLevelBudgeted.has(t.category_id)) return false;
      if (t.subcategory_id && subcategoryBudgeted.has(`${t.category_id}:${t.subcategory_id}`)) {
        return false;
      }
      return true;
    })
    .map((t) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      description: t.description,
      categoryId: t.category_id,
      categoryName: categoryById.get(t.category_id)?.name ?? "Lainnya",
      categoryIcon: categoryById.get(t.category_id)?.icon ?? null,
      subcategoryId: t.subcategory_id,
      subcategoryName: t.subcategory_id
        ? (subcategoryNameById.get(t.subcategory_id) ?? null)
        : null,
      accountName: accountNameById.get(t.account_id) ?? "-",
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface DuplicateBudgetsResult {
  inserted: number;
  skipped: number;
}

// Kunci unik budget sekarang kategori+subkategori (subkategori null = budget
// level kategori), bukan cuma kategori — lihat migrasi 0014_subcategories.
function budgetKey(categoryId: string, subcategoryId: string | null) {
  return `${categoryId}:${subcategoryId ?? ""}`;
}

// Duplikasi semua anggaran bulan berjalan ke bulan berikutnya (target_amount
// & notes disalin, realisasi otomatis 0 karena belum ada transaksi di bulan
// itu). Kategori/sub kategori yang sudah punya anggaran di bulan berikutnya
// dilewati.
export async function duplicateBudgetsToNextMonth(
  supabase: Client,
  familyId: string,
  currentMonthDate: Date,
  monthStartDay: number
): Promise<DuplicateBudgetsResult> {
  const currentCycleStart = getCycleStart(currentMonthDate, monthStartDay);
  const currentMonth = toLocalISODate(currentCycleStart);
  const nextMonthDate = shiftCycle(currentCycleStart, 1);
  const nextMonth = toLocalISODate(nextMonthDate);

  const [
    { data: currentBudgets, error: currentError },
    { data: nextBudgets, error: nextError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("category_id, subcategory_id, target_amount, notes")
      .eq("family_id", familyId)
      .eq("month", currentMonth),
    supabase
      .from("budgets")
      .select("category_id, subcategory_id")
      .eq("family_id", familyId)
      .eq("month", nextMonth),
  ]);

  if (currentError) throw currentError;
  if (nextError) throw nextError;

  const existingNextKeys = new Set(
    nextBudgets.map((b) => budgetKey(b.category_id, b.subcategory_id))
  );
  const toInsert = currentBudgets.filter(
    (b) => !existingNextKeys.has(budgetKey(b.category_id, b.subcategory_id))
  );

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: currentBudgets.length };
  }

  const { error: insertError } = await supabase.from("budgets").insert(
    toInsert.map((b) => ({
      family_id: familyId,
      month: nextMonth,
      category_id: b.category_id,
      subcategory_id: b.subcategory_id,
      target_amount: b.target_amount,
      notes: b.notes,
    }))
  );
  if (insertError) throw insertError;

  return {
    inserted: toInsert.length,
    skipped: currentBudgets.length - toInsert.length,
  };
}
