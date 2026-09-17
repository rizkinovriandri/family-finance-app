import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { listHoldingsForAccount } from "@/lib/supabase/queries/investments";
import { HoldingsManager } from "@/components/HoldingsManager";

export default async function AccountHoldingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const accounts = await listAccounts(supabase, membership.family_id);
  const account = accounts.find((a) => a.id === id);
  if (!account) {
    notFound();
  }

  const holdings = await listHoldingsForAccount(supabase, account.id);

  return (
    <div className="px-4 pt-8">
      <HoldingsManager
        familyId={membership.family_id}
        accountId={account.id}
        accountName={account.name}
        initialHoldings={holdings}
      />
    </div>
  );
}
