import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { AccountFormValues } from "@/lib/validation/account";

type Client = SupabaseClient<Database>;
type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

export type AccountWithBalance = AccountRow & { current_balance: number };

export async function listAccounts(
  supabase: Client,
  familyId: string
): Promise<AccountWithBalance[]> {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const { data: balances, error: balanceError } = await supabase
    .from("account_balances")
    .select("account_id, current_balance")
    .eq("family_id", familyId);
  if (balanceError) throw balanceError;

  const balanceByAccountId = new Map(
    balances.map((b) => [b.account_id, b.current_balance])
  );

  return accounts.map((account) => ({
    ...account,
    current_balance: balanceByAccountId.get(account.id) ?? account.opening_balance,
  }));
}

function toInsertPayload(input: AccountFormValues) {
  return {
    name: input.name,
    account_type: input.account_type,
    institution: input.institution || null,
    account_identifier: input.account_identifier || null,
    owner_member_id: input.owner_member_id || null,
    currency: input.currency,
    opening_balance: input.opening_balance,
    status: input.status,
    priority_goal: input.priority_goal || null,
    notes: input.notes || null,
  };
}

export async function createAccount(
  supabase: Client,
  familyId: string,
  input: AccountFormValues
) {
  const { data, error } = await supabase
    .from("accounts")
    .insert({ family_id: familyId, ...toInsertPayload(input) })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(
  supabase: Client,
  accountId: string,
  input: AccountFormValues
) {
  const { error } = await supabase
    .from("accounts")
    .update({ ...toInsertPayload(input), updated_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) throw error;
}

export async function deleteAccount(supabase: Client, accountId: string) {
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) throw error;
}
