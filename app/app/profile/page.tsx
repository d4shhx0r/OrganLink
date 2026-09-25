import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile: Profile = {
    id: user.id,
    email: user.email || "",
    full_name: null,
    role: "donor",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) {
      profile = data as Profile;
    }
  } catch (err) {
    console.error("[Profile Page] Error loading profile:", err);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
          User Account Profile
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Manage your personal information and verified role association within the OrganLink network
        </p>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
