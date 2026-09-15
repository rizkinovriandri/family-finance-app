import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { getMonthlySummary } from "@/lib/supabase/queries/transactions";
import { CreateFamilyForm } from "@/components/CreateFamilyForm";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    return (
      <div className="px-4 pt-8">
        <CreateFamilyForm />
      </div>
    );
  }

  const [accounts, summary] = await Promise.all([
    listAccounts(supabase, membership.family_id),
    getMonthlySummary(supabase, membership.family_id),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <DashboardView
      displayName={membership.display_name}
      familyName={membership.family_name}
      totalBalance={totalBalance}
      accountsCount={accounts.length}
      totalIncome={summary.totalIncome}
      totalExpense={summary.totalExpense}
      categories={summary.categories}
    />
  );
}
