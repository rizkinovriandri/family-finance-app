import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { StartDateSettings } from "@/components/StartDateSettings";

export default async function StartDatePage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 pt-8">
      <StartDateSettings
        familyId={membership.family_id}
        initialMonthStartDay={membership.month_start_day}
      />
    </div>
  );
}
