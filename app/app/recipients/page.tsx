import { createClient } from "@/lib/supabase/server";
import { RecipientList } from "@/components/recipients/RecipientList";
import type { Recipient, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function RecipientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let role: AppRole = "recipient";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role as AppRole;
  } catch {
    role = "recipient";
  }

  let recipients: Recipient[] = [];
  try {
    const query = supabase
      .from("recipients")
      .select("*")
      .order("waiting_since", { ascending: true }); // Prioritize waiting time

    if (role === "recipient") {
      query.eq("profile_id", user.id);
    }

    const { data } = await query;
    recipients = (data as Recipient[]) || [];
  } catch (err) {
    console.error("[Recipients Page] Error:", err);
  }

  const canCreate =
    role === "admin" || role === "hospital" || role === "recipient";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
          Recipient / Patient Registry
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          {role === "recipient"
            ? "View and manage your organ request and waiting list status"
            : "Patient waiting list, organ demand, and clinical urgency categorization"}
        </p>
      </div>

      <RecipientList recipients={recipients} canCreate={canCreate} />
    </div>
  );
}
