import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CategoryType } from "@/lib/types/database";
import type { CategoryFormValues } from "@/lib/validation/category";

type Client = SupabaseClient<Database>;

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  icon: string | null;
}

export async function listCategories(supabase: Client): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, is_default, icon")
    .order("name");
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    isDefault: c.is_default,
    icon: c.icon,
  }));
}

export async function createCategory(
  supabase: Client,
  familyId: string,
  input: CategoryFormValues
) {
  const { error } = await supabase.from("categories").insert({
    family_id: familyId,
    name: input.name,
    type: input.type,
    icon: input.icon,
    is_default: false,
  });
  if (error) throw error;
}

export async function updateCategory(
  supabase: Client,
  categoryId: string,
  input: Pick<CategoryFormValues, "name" | "icon">
) {
  const { error } = await supabase
    .from("categories")
    .update({ name: input.name, icon: input.icon })
    .eq("id", categoryId);
  if (error) throw error;
}

export async function deleteCategory(supabase: Client, categoryId: string) {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) {
    // 23503 = foreign key violation — kategori masih dipakai transaksi/budget.
    if (error.code === "23503") {
      throw new Error(
        "Kategori ini masih dipakai di transaksi atau anggaran, tidak bisa dihapus."
      );
    }
    throw error;
  }
}
