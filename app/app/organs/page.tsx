import { createClient } from "@/lib/supabase/server";
import { OrganList } from "@/components/organs/OrganList";
import type { Organ, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function OrgansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let role: AppRole = "hospital";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role as AppRole;
  } catch {
    role = "hospital";
  }

  let organs: Organ[] = [];
  try {
    const { data } = await supabase
      .from("organs")
      .select("*")
      .order("created_at", { ascending: false });
    organs = (data as Organ[]) || [];
  } catch (err) {
    console.error("[Organs Page] Query error:", err);
  }

  const canCreate = role === "admin" || role === "hospital";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
          Available Organ Registry
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Catalog of procured organs from approved donors available for compatibility matching
        </p>
      </div>

      <OrganList organs={organs} canCreate={canCreate} />
    </div>
  );
}
