import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { generateInviteCode } from "@/lib/utils/inviteCode";

type Client = SupabaseClient<Database>;

export async function getMyFamilyMembership(supabase: Client) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Digabung jadi satu query (embedded join lewat FK family_id) supaya
  // tidak perlu 2 round-trip terpisah ke Supabase — dipanggil di hampir
  // semua halaman jadi lumayan berpengaruh ke waktu load.
  const { data: membership, error } = await supabase
    .from("family_members")
    .select("id, family_id, display_name, avatar_url, families(name, month_start_day)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!membership) return null;

  const family = membership.families;
  if (!family) return null;

  return {
    id: membership.id,
    family_id: membership.family_id,
    display_name: membership.display_name,
    avatar_url: membership.avatar_url,
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

export async function updateDisplayName(
  supabase: Client,
  memberId: string,
  displayName: string
) {
  const { error } = await supabase
    .from("family_members")
    .update({ display_name: displayName })
    .eq("id", memberId);
  if (error) throw error;
}

const AVATAR_BUCKET = "avatars";

// Nama file tetap ("avatar.<ext>") supaya upload berikutnya menimpa file
// lama (upsert) alih-alih menumpuk file yatim di storage. Query string
// timestamp ditempel ke URL yang disimpan supaya browser/CDN tidak
// menampilkan cache gambar lama setelah foto diganti.
export async function uploadAvatar(supabase: Client, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateAvatarUrl(
  supabase: Client,
  memberId: string,
  avatarUrl: string | null
) {
  const { error } = await supabase
    .from("family_members")
    .update({ avatar_url: avatarUrl })
    .eq("id", memberId);
  if (error) throw error;
}

export async function updateFamilyName(
  supabase: Client,
  familyId: string,
  familyName: string
) {
  const { error } = await supabase
    .from("families")
    .update({ name: familyName })
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
