import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { ProfileSettings } from "@/components/ProfileSettings";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = await getMyFamilyMembership(supabase);

  if (!user || !membership) {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 pt-8">
      <ProfileSettings
        userId={user.id}
        memberId={membership.id}
        familyId={membership.family_id}
        initialDisplayName={membership.display_name}
        initialFamilyName={membership.family_name}
        initialAvatarUrl={membership.avatar_url}
      />
    </div>
  );
}
