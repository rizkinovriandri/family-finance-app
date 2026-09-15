import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { getMonthlySummary, getMonthlyTrend } from "@/lib/supabase/queries/transactions";
import { listBudgetsForMonth } from "@/lib/supabase/queries/budgets";
import { FamilyOnboarding } from "@/components/FamilyOnboarding";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    return (
      <div className="px-4 pt-8">
        <FamilyOnboarding />
      </div>
    );
  }

  const [accounts, summary, budgets, trend] = await Promise.all([
    listAccounts(supabase, membership.family_id),
    getMonthlySummary(supabase, membership.family_id),
    listBudgetsForMonth(supabase, membership.family_id, new Date()),
    getMonthlyTrend(supabase, membership.family_id),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const budgetTarget = budgets.reduce((sum, b) => sum + b.targetAmount, 0);
  const budgetRealisasi = budgets.reduce((sum, b) => sum + b.realisasi, 0);
  const overBudgetCategories = budgets
    .filter((b) => b.status === "Melebihi")
    .map((b) => b.categoryName);

  return (
    <DashboardView
      displayName={membership.display_name}
      familyName={membership.family_name}
      totalBalance={totalBalance}
      accountsCount={accounts.length}
      totalIncome={summary.totalIncome}
      totalExpense={summary.totalExpense}
      categories={summary.categories}
      budgetTarget={budgetTarget}
      budgetRealisasi={budgetRealisasi}
      overBudgetCategories={overBudgetCategories}
      trend={trend}
    />
  );
}
