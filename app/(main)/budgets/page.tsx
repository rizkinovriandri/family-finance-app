import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listCategories } from "@/lib/supabase/queries/categories";
import { listBudgetsForMonth } from "@/lib/supabase/queries/budgets";
import { BudgetsManager } from "@/components/BudgetsManager";
import { getCycleStart, toLocalISODate } from "@/lib/utils/date";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const monthStart = getCycleStart(new Date(), membership.month_start_day);

  const [categories, budgets] = await Promise.all([
    listCategories(supabase),
    listBudgetsForMonth(supabase, membership.family_id, monthStart, membership.month_start_day),
  ]);

  return (
    <div className="px-4 pt-8 pb-4">
      <BudgetsManager
        familyId={membership.family_id}
        monthStartDay={membership.month_start_day}
        categories={categories}
        initialBudgets={budgets}
        initialMonth={toLocalISODate(monthStart)}
      />
    </div>
  );
}
