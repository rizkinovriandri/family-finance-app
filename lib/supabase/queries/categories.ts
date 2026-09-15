import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CategoryType } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export async function listCategories(supabase: Client): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .order("name");
  if (error) throw error;
  return data;
}
