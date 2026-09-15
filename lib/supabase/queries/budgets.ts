import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { BudgetFormValues } from "@/lib/validation/budget";

type Client = SupabaseClient<Database>;

export interface BudgetWithRealization {
  id: string;
  categoryId: string;
  categoryName: string;
  targetAmount: number;
  realisasi: number;
  percentage: number;
  status: "Aman" | "Waspada" | "Melebihi";
  notes: string | null;
}

function toMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function statusFor(percentage: number): BudgetWithRealization["status"] {
  if (percentage > 100) return "Melebihi";
  if (percentage >= 80) return "Waspada";
  return "Aman";
}

export async function listBudgetsForMonth(
  supabase: Client,
  familyId: string,
  monthDate: Date
): Promise<BudgetWithRealization[]> {
  const month = toMonthStart(monthDate);

  const [
    { data: budgets, error: budgetError },
    { data: realizations, error: realizationError },
    { data: categories, error: catError },
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
    supabase.from("categories").select("id, name"),
  ]);

  if (budgetError) throw budgetError;
  if (realizationError) throw realizationError;
  if (catError) throw catError;

  const realisasiByBudgetId = new Map(realizations.map((r) => [r.budget_id, r.realisasi]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return budgets
    .map((b) => {
      const realisasi = realisasiByBudgetId.get(b.id) ?? 0;
      const percentage =
        b.target_amount > 0 ? Math.round((realisasi / b.target_amount) * 100) : 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: categoryNameById.get(b.category_id) ?? "Lainnya",
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
  input: BudgetFormValues
) {
  const { error } = await supabase.from("budgets").insert({
    family_id: familyId,
    month: toMonthStart(monthDate),
    category_id: input.category_id,
    target_amount: input.target_amount,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateBudget(
  supabase: Client,
  budgetId: string,
  input: Pick<BudgetFormValues, "target_amount" | "notes">
) {
  const { error } = await supabase
    .from("budgets")
    .update({ target_amount: input.target_amount, notes: input.notes || null })
    .eq("id", budgetId);
  if (error) throw error;
}

export async function deleteBudget(supabase: Client, budgetId: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
  if (error) throw error;
}
