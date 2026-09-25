import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewOrganForm } from "@/components/organs/NewOrganForm";
import type { Donor, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function NewOrganPage() {
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

  // Only Admin or Hospital can register organs
  if (role !== "admin" && role !== "hospital") {
    redirect("/app/organs");
  }

  // Fetch approved donors
  let approvedDonors: Donor[] = [];
  try {
    const { data } = await supabase
      .from("donors")
      .select("*")
      .eq("approval_status", "approved")
      .order("full_name", { ascending: true });
    approvedDonors = (data as Donor[]) || [];
  } catch {
    approvedDonors = [];
  }

  return (
    <div className="py-4">
      <NewOrganForm approvedDonors={approvedDonors} />
    </div>
  );
}
