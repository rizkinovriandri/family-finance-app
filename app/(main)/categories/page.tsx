import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listCategories } from "@/lib/supabase/queries/categories";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  const categories = await listCategories(supabase);

  return (
    <div className="px-4 pt-8">
      <CategoriesManager familyId={membership.family_id} initialCategories={categories} />
    </div>
  );
}
