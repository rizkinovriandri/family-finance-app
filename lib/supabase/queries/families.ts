import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

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
    .select("name")
    .eq("id", membership.family_id)
    .single();

  if (familyError) throw familyError;

  return { ...membership, family_name: family.name };
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

  const { error: familyError } = await supabase
    .from("families")
    .insert({ id: familyId, name: familyName });
  if (familyError) throw familyError;

  const { error: memberError } = await supabase.from("family_members").insert({
    family_id: familyId,
    user_id: user.id,
    display_name: displayName,
  });
  if (memberError) throw memberError;

  return { id: familyId, name: familyName };
}
