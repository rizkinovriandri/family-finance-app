import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership, listFamilyMembers } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { listCategories } from "@/lib/supabase/queries/categories";
import { listSubcategories } from "@/lib/supabase/queries/subcategories";
import { listTransactions } from "@/lib/supabase/queries/transactions";
import { TransactionsManager } from "@/components/TransactionsManager";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const [accounts, members, categories, subcategories, transactions] = await Promise.all([
    listAccounts(supabase, membership.family_id),
    listFamilyMembers(supabase, membership.family_id),
    listCategories(supabase),
    listSubcategories(supabase, membership.family_id),
    listTransactions(supabase, membership.family_id),
  ]);

  return (
    <div className="px-4 pt-8">
      <TransactionsManager
        familyId={membership.family_id}
        accounts={accounts}
        members={members}
        categories={categories}
        subcategories={subcategories}
        defaultMemberId={membership.id}
        initialTransactions={transactions}
      />
    </div>
  );
}
