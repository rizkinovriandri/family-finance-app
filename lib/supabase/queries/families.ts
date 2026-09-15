import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getMyFamilyMembership(supabase: Client) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("family_members")
    .select("id, family_id, display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

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

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ name: familyName })
    .select()
    .single();
  if (familyError) throw familyError;

  const { error: memberError } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: user.id,
    display_name: displayName,
  });
  if (memberError) throw memberError;

  return family;
}
