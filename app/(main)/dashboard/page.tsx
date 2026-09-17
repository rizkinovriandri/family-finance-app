import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { getMonthlySummary, getMonthlyTrend } from "@/lib/supabase/queries/transactions";
import { listBudgetsForMonth } from "@/lib/supabase/queries/budgets";
import { getPortfolioValueByAccount } from "@/lib/supabase/queries/investments";
import { isInvestmentAccountType } from "@/lib/constants/enums";
import { FamilyOnboarding } from "@/components/FamilyOnboarding";
import { DashboardView } from "@/components/DashboardView";
import { RealtimeDashboardSync } from "@/components/RealtimeDashboardSync";

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

  const [accounts, summary, budgets, trend, portfolioValueByAccount] = await Promise.all([
    listAccounts(supabase, membership.family_id),
    getMonthlySummary(supabase, membership.family_id, membership.month_start_day),
    listBudgetsForMonth(
      supabase,
      membership.family_id,
      new Date(),
      membership.month_start_day
    ),
    getMonthlyTrend(supabase, membership.family_id, membership.month_start_day),
    getPortfolioValueByAccount(supabase, membership.family_id),
  ]);

  // Akun investasi nilainya dari holding di Portofolio, bukan saldo
  // transaksi kas — lihat catatan yang sama di AccountsManager.
  const totalBalance = accounts.reduce((sum, a) => {
    const value = isInvestmentAccountType(a.account_type)
      ? (portfolioValueByAccount.get(a.id) ?? 0)
      : a.current_balance;
    return sum + value;
  }, 0);
  const budgetTarget = budgets.reduce((sum, b) => sum + b.targetAmount, 0);
  const budgetRealisasi = budgets.reduce((sum, b) => sum + b.realisasi, 0);
  const overBudgetCategories = budgets
    .filter((b) => b.status === "Melebihi")
    .map((b) => b.categoryName);

  return (
    <>
      <RealtimeDashboardSync familyId={membership.family_id} />
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
    </>
  );
}
