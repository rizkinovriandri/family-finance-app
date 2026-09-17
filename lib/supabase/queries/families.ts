import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { generateInviteCode } from "@/lib/utils/inviteCode";

type Client = SupabaseClient<Database>;

export async function getMyFamilyMembership(supabase: Client) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error } = await supabase
    .from("family_members")
    .select("id, family_id, display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!membership) return null;

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("name, month_start_day")
    .eq("id", membership.family_id)
    .single();

  if (familyError) throw familyError;

  return {
    ...membership,
    family_name: family.name,
    month_start_day: family.month_start_day,
  };
}

export async function updateMonthStartDay(
  supabase: Client,
  familyId: string,
  monthStartDay: number
) {
  const { error } = await supabase
    .from("families")
    .update({ month_start_day: monthStartDay })
    .eq("id", familyId);
  if (error) throw error;
}

export async function listFamilyMembers(supabase: Client, familyId: string) {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, display_name")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createFamilyWithOwner(
  supabase: Client,
  familyName: string,
  displayName: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  // ID di-generate di client (bukan pakai .select() setelah insert) karena
  // RLS select "families" mensyaratkan user sudah jadi family_members —
  // padahal baris family_members-nya baru dibuat di langkah berikutnya.
  const familyId = crypto.randomUUID();
  const inviteCode = generateInviteCode();

  const { error: familyError } = await supabase
    .from("families")
    .insert({ id: familyId, name: familyName, invite_code: inviteCode });
  if (familyError) throw familyError;

  const { error: memberError } = await supabase.from("family_members").insert({
    family_id: familyId,
    user_id: user.id,
    display_name: displayName,
  });
  if (memberError) throw memberError;

  return { id: familyId, name: familyName, invite_code: inviteCode };
}

export async function joinFamilyByInviteCode(
  supabase: Client,
  inviteCode: string,
  displayName: string
) {
  const { data, error } = await supabase.rpc("join_family_by_invite_code", {
    p_code: inviteCode.trim().toUpperCase(),
    p_display_name: displayName,
  });
  if (error) throw error;
  return data[0];
}

export async function getFamilyInviteCode(supabase: Client, familyId: string) {
  const { data, error } = await supabase
    .from("families")
    .select("invite_code")
    .eq("id", familyId)
    .single();
  if (error) throw error;
  return data.invite_code;
}
