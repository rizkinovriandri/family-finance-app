import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

export async function listSubcategories(
  supabase: Client,
  familyId: string
): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, name")
    .eq("family_id", familyId)
    .order("name");
  if (error) throw error;
  return data.map((s) => ({ id: s.id, categoryId: s.category_id, name: s.name }));
}

export async function createSubcategory(
  supabase: Client,
  familyId: string,
  categoryId: string,
  name: string
) {
  const { error } = await supabase
    .from("subcategories")
    .insert({ family_id: familyId, category_id: categoryId, name });
  if (error) throw error;
}

export async function updateSubcategory(supabase: Client, id: string, name: string) {
  const { error } = await supabase.from("subcategories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteSubcategory(supabase: Client, id: string) {
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Sub kategori ini masih dipakai di transaksi atau anggaran, tidak bisa dihapus."
      );
    }
    throw error;
  }
}
