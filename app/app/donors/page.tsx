import { createClient } from "@/lib/supabase/server";
import { DonorList } from "@/components/donors/DonorList";
import type { Donor, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function DonorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch verified profile role
  let role: AppRole = "donor";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role as AppRole;
  } catch {
    role = "donor";
  }

  // Fetch donors through RLS
  let donors: Donor[] = [];
  try {
    const query = supabase
      .from("donors")
      .select("*")
      .order("created_at", { ascending: false });

    // If regular donor, filter by profile_id
    if (role === "donor") {
      query.eq("profile_id", user.id);
    }

    const { data } = await query;
    donors = (data as Donor[]) || [];
  } catch (err) {
    console.error("[Donors Page] Error querying donors:", err);
  }

  const canCreate = role === "admin" || role === "hospital" || role === "donor";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
            Donor Registry
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            {role === "donor"
              ? "View and manage your organ donation registration"
              : "Clinical donor management and verification records"}
          </p>
        </div>
      </div>

      <DonorList donors={donors} canCreate={canCreate} />
    </div>
  );
}
