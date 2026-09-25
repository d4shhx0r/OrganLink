import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  HeartHandshake,
  Users,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
  PlusCircle,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import type { AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Retrieve user profile
  let role: AppRole = "donor";
  let profileName = user.email;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = (profile.role as AppRole) || "donor";
      profileName = profile.full_name || user.email;
    }
  } catch {
    role = "donor";
  }

  // Real Database Counts (NO fabricated statistics)
  let totalDonors = 0;
  let pendingDonors = 0;
  let totalRecipients = 0;
  let availableOrgans = 0;
  let recentAuditLogs: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    current_hash: string;
  }> = [];

  // User-specific records for donor/recipient roles
  let myDonorRecord = null;
  let myRecipientRecord = null;

  try {
    if (role === "admin" || role === "hospital") {
      const [donorsRes, pendingRes, recipientsRes, organsRes, auditRes] =
        await Promise.all([
          supabase.from("donors").select("id", { count: "exact", head: true }),
          supabase
            .from("donors")
            .select("id", { count: "exact", head: true })
            .eq("approval_status", "pending"),
          supabase
            .from("recipients")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("organs")
            .select("id", { count: "exact", head: true })
            .eq("availability_status", "available"),
          supabase
            .from("audit_logs")
            .select("id, action, entity_type, entity_id, created_at, current_hash")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      totalDonors = donorsRes.count || 0;
      pendingDonors = pendingRes.count || 0;
      totalRecipients = recipientsRes.count || 0;
      availableOrgans = organsRes.count || 0;
      recentAuditLogs = auditRes.data || [];
    } else if (role === "donor") {
      const { data: donor } = await supabase
        .from("donors")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      myDonorRecord = donor;
    } else if (role === "recipient") {
      const { data: recipient } = await supabase
        .from("recipients")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      myRecipientRecord = recipient;
    }
  } catch (err) {
    console.error("[Dashboard] Query error:", err);
  }

  return (
    <div className="space-y-8">
      {/* Top Greeting & Role Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#171717] tracking-tight">
            Welcome back, {profileName}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            OrganLink Registry &bull; Access Level:{" "}
            <span className="font-semibold text-[#7C00D9] capitalize">
              {role}
            </span>
          </p>
        </div>

        {/* Quick Actions (Privileged) */}
        {(role === "admin" || role === "hospital") && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/app/donors/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Donor</span>
            </Link>
            <Link
              href="/app/recipients/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F1F3F3] text-[#171717] hover:bg-[#E5E7EB] transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </Link>
            <Link
              href="/app/organs/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F1F3F3] text-[#171717] hover:bg-[#E5E7EB] transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Register Organ</span>
            </Link>
          </div>
        )}
      </div>

      {/* ADMIN & HOSPITAL VIEW */}
      {(role === "admin" || role === "hospital") && (
        <>
          {/* Key Metric Indicators (Real DB Counts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7280]">
                  Total Donors
                </span>
                <HeartHandshake className="w-4 h-4 text-[#7C00D9]" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold text-[#171717]">
                  {totalDonors}
                </span>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {totalDonors === 0 ? "No donor records yet" : "Registered in network"}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7280]">
                  Pending Approvals
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold text-amber-600">
                  {pendingDonors}
                </span>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {pendingDonors === 0 ? "All reviews complete" : "Awaiting clinical review"}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7280]">
                  Waiting Recipients
                </span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold text-[#171717]">
                  {totalRecipients}
                </span>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {totalRecipients === 0 ? "No recipient records yet" : "Active waiting list"}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7280]">
                  Available Organs
                </span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold text-emerald-600">
                  {availableOrgans}
                </span>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {availableOrgans === 0 ? "No organs currently registered" : "Ready for matching"}
                </p>
              </div>
            </div>
          </div>

          {/* Research Workflow Section */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
            <h2 className="text-base font-semibold text-[#171717] tracking-tight mb-2">
              Research Process Flow (Phase 2)
            </h2>
            <p className="text-xs text-[#6B7280] mb-5">
              Preserving the academic paper workflow: Donor Registration &rarr; Hospital Approval &rarr; Organ Availability &rarr; Recipient Waiting List &rarr; Cryptographic Audit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#F3F4F6]">
                <span className="font-semibold text-[#171717] block mb-1">
                  1. Donor Registry
                </span>
                <span className="text-[#6B7280]">
                  Capture blood group, HLA tissue typing, and consent.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#F3F4F6]">
                <span className="font-semibold text-[#171717] block mb-1">
                  2. Hospital Approval
                </span>
                <span className="text-[#6B7280]">
                  Authorized hospital verifies donor and logs approval event.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#F3F4F6]">
                <span className="font-semibold text-[#171717] block mb-1">
                  3. Organ Availability
                </span>
                <span className="text-[#6B7280]">
                  Register procured organ associated with approved donor.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#F3F4F6]">
                <span className="font-semibold text-[#171717] block mb-1">
                  4. Recipient Registry
                </span>
                <span className="text-[#6B7280]">
                  Profile patient urgency and waiting time for Phase 3 engine.
                </span>
              </div>
            </div>
          </div>

          {/* Recent Cryptographic Audit Logs */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C00D9]" />
                <h2 className="text-base font-semibold text-[#171717]">
                  Recent Audit Trail
                </h2>
              </div>
              <Link
                href="/app/audit"
                className="text-xs text-[#7C00D9] hover:underline font-medium flex items-center gap-1"
              >
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-[#9CA3AF] text-xs">
                No audit events recorded yet. Mutations will append cryptographic blocks here.
              </div>
            ) : (
              <div className="divide-y divide-[#F3F4F6]">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#F1F3F3] text-[#171717]">
                        {log.action}
                      </span>
                      <span className="text-[#6B7280]">
                        Entity: <strong className="text-[#171717]">{log.entity_type}</strong> ({log.entity_id.slice(0, 8)}...)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#9CA3AF]">
                      <span className="font-mono text-[10px] hidden md:inline truncate max-w-[140px]" title={log.current_hash}>
                        hash: {log.current_hash.slice(0, 10)}...
                      </span>
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* DONOR SPECIFIC VIEW */}
      {role === "donor" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
            <h2 className="text-base font-semibold text-[#171717] mb-2">
              My Donation Status
            </h2>
            {myDonorRecord ? (
              <div className="mt-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Donor Reference</span>
                  <span className="font-mono font-semibold text-xs text-[#171717]">
                    {myDonorRecord.donor_reference}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Approval Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      myDonorRecord.approval_status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : myDonorRecord.approval_status === "rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {myDonorRecord.approval_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Blood Group / HLA</span>
                  <span className="text-xs font-medium text-[#171717]">
                    {myDonorRecord.blood_group} &bull; {myDonorRecord.tissue_type}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm text-[#171717] font-medium">
                  No donor records yet
                </p>
                <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                  Register your donor preferences to join the secure research matching registry.
                </p>
                <Link
                  href="/app/donors/new"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Submit Donor Registration</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECIPIENT SPECIFIC VIEW */}
      {role === "recipient" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
            <h2 className="text-base font-semibold text-[#171717] mb-2">
              My Organ Request Status
            </h2>
            {myRecipientRecord ? (
              <div className="mt-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Recipient Reference</span>
                  <span className="font-mono font-semibold text-xs text-[#171717]">
                    {myRecipientRecord.recipient_reference}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Required Organ</span>
                  <span className="text-xs font-semibold text-[#7C00D9] uppercase">
                    {myRecipientRecord.required_organ}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Waiting List Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {myRecipientRecord.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm text-[#171717] font-medium">
                  No recipient records yet
                </p>
                <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                  Submit your organ request to be placed on the research waiting list.
                </p>
                <Link
                  href="/app/recipients/new"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Organ Request</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
