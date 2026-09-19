import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listCategories } from "@/lib/supabase/queries/categories";
import { listSubcategories } from "@/lib/supabase/queries/subcategories";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const [categories, subcategories] = await Promise.all([
    listCategories(supabase),
    listSubcategories(supabase, membership.family_id),
  ]);

  return (
    <div className="px-4 pt-8">
      <CategoriesManager
        familyId={membership.family_id}
        initialCategories={categories}
        initialSubcategories={subcategories}
      />
    </div>
  );
}
