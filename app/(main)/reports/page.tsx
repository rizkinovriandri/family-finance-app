import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { getReportSummary } from "@/lib/supabase/queries/reports";
import { listCategories } from "@/lib/supabase/queries/categories";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { getPortfolioValueByAccount } from "@/lib/supabase/queries/investments";
import { ReportsView } from "@/components/ReportsView";
import { getCycleStart, toLocalISODate } from "@/lib/utils/date";

export default async function ReportsPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const monthStart = getCycleStart(new Date(), membership.month_start_day);
  const [summary, categories, accounts, portfolioValueByAccount] = await Promise.all([
    getReportSummary(
      supabase,
      membership.family_id,
      monthStart,
      membership.month_start_day,
      "Pengeluaran"
    ),
    listCategories(supabase),
    listAccounts(supabase, membership.family_id),
    getPortfolioValueByAccount(supabase, membership.family_id),
  ]);

  return (
    <div className="px-4 pt-8">
      <ReportsView
        familyId={membership.family_id}
        monthStartDay={membership.month_start_day}
        initialSummary={summary}
        initialMonth={toLocalISODate(monthStart)}
        categories={categories}
        initialAccounts={accounts}
        initialPortfolioValueByAccount={Object.fromEntries(portfolioValueByAccount)}
      />
    </div>
  );
}
