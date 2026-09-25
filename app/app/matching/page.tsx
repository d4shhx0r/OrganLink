import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchingDashboardView } from "@/components/matching/MatchingDashboardView";
import type { Organ, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function MatchingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  // Authorization check: Only Admin and Hospital can access matching engine
  if (role !== "admin" && role !== "hospital") {
    redirect("/app/dashboard");
  }

  // Fetch all organs currently available for matching
  let availableOrgans: Organ[] = [];
  try {
    const { data } = await supabase
      .from("organs")
      .select("*")
      .eq("availability_status", "available")
      .order("created_at", { ascending: false });
    availableOrgans = (data as Organ[]) || [];
  } catch (err) {
    console.error("[Matching Page] Error fetching available organs:", err);
  }

  return (
    <div className="py-2">
      <MatchingDashboardView availableOrgans={availableOrgans} />
    </div>
  );
}
