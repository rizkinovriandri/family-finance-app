import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership, listFamilyMembers } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { getPortfolioValueByAccount } from "@/lib/supabase/queries/investments";
import { AccountsManager } from "@/components/AccountsManager";

export default async function AccountsPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const [accounts, members, portfolioValueByAccount] = await Promise.all([
    listAccounts(supabase, membership.family_id),
    listFamilyMembers(supabase, membership.family_id),
    getPortfolioValueByAccount(supabase, membership.family_id),
  ]);

  return (
    <div className="px-4 pt-8 pb-4">
      <AccountsManager
        familyId={membership.family_id}
        members={members}
        currentMemberId={membership.id}
        initialDefaultAccountId={membership.default_account_id}
        initialAccounts={accounts}
        initialPortfolioValueByAccount={Object.fromEntries(portfolioValueByAccount)}
      />
    </div>
  );
}
