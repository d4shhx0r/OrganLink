import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { verifyAuditChainIntegrity } from "@/lib/audit/audit-service";
import type { AppRole } from "@/lib/types/organlink";
import type { AuditRecord } from "@/lib/audit/audit-service";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
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

  // Authorization check: Only Admin and Hospital can access full audit logs
  if (role !== "admin" && role !== "hospital") {
    redirect("/app/dashboard");
  }

  // Fetch audit records
  let records: AuditRecord[] = [];
  try {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    records = (data as AuditRecord[]) || [];
  } catch (err) {
    console.error("[Audit Page] Query error:", err);
  }

  // Run cryptographic hash integrity check
  const integrity = await verifyAuditChainIntegrity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
          Tamper-Evident Audit Ledger
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Cryptographically chained append-only audit trail guaranteeing provenance for all donor, patient, and organ transactions
        </p>
      </div>

      <AuditLogViewer
        initialRecords={records}
        integrityStatus={integrity}
      />
    </div>
  );
}
