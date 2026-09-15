import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listCategories } from "@/lib/supabase/queries/categories";
import { listBudgetsForMonth } from "@/lib/supabase/queries/budgets";
import { BudgetsManager } from "@/components/BudgetsManager";
import { toLocalISODate } from "@/lib/utils/date";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [categories, budgets] = await Promise.all([
    listCategories(supabase),
    listBudgetsForMonth(supabase, membership.family_id, monthStart),
  ]);

  return (
    <div className="px-4 pt-8 pb-4">
      <BudgetsManager
        familyId={membership.family_id}
        categories={categories}
        initialBudgets={budgets}
        initialMonth={toLocalISODate(monthStart)}
      />
    </div>
  );
}
