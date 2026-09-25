import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchingDashboardView } from "@/components/matching/MatchingDashboardView";
import type { Organ, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

interface OrganMatchingPageProps {
  params: { organId: string };
}

export default async function OrganMatchingPage({
  params,
}: OrganMatchingPageProps) {
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

  if (role !== "admin" && role !== "hospital") {
    redirect("/app/dashboard");
  }

  let availableOrgans: Organ[] = [];
  try {
    const { data } = await supabase
      .from("organs")
      .select("*")
      .eq("availability_status", "available")
      .order("created_at", { ascending: false });
    availableOrgans = (data as Organ[]) || [];
  } catch (err) {
    console.error("[Organ Matching Page] Error fetching organs:", err);
  }

  return (
    <div className="py-2">
      <MatchingDashboardView
        availableOrgans={availableOrgans}
        initialOrganId={params.organId}
      />
    </div>
  );
}
