import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Users, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Recipient, AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

interface RecipientDetailPageProps {
  params: { id: string };
}

export default async function RecipientDetailPage({
  params,
}: RecipientDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  const { data: recData, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !recData) {
    notFound();
  }

  const recipient = recData as Recipient;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/app/recipients"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recipients</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#7C00D9]/10 text-[#7C00D9]">
                {recipient.recipient_reference}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {recipient.status}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#171717] tracking-tight mt-1">
              {recipient.full_name}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-6">
        <h2 className="text-base font-semibold text-[#171717] border-b border-[#F3F4F6] pb-3">
          Patient Profile &amp; Organ Demand
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[#6B7280] block mb-1">Required Organ</span>
            <span className="text-sm font-semibold uppercase text-[#7C00D9]">
              {recipient.required_organ}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Blood Group</span>
            <span className="text-sm font-semibold text-[#171717]">
              {recipient.blood_group}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Tissue Typing (HLA)</span>
            <span className="text-sm font-mono text-[#171717]">
              {recipient.tissue_type}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Clinical Urgency</span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                recipient.medical_urgency === "status_1_critical"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : recipient.medical_urgency === "status_2_urgent"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {recipient.medical_urgency.replace(/_/g, " ")}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Treatment Facility</span>
            <span className="text-sm font-medium text-[#171717]">
              {recipient.location}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Waiting Since</span>
            <span className="text-sm font-medium text-[#171717]">
              {new Date(recipient.waiting_since).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] text-xs text-[#6B7280] flex items-start gap-3">
          <Clock className="w-4 h-4 text-[#7C00D9] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#171717] block">
              Waiting List Queue Priority
            </span>
            <p className="mt-0.5">
              Compatibility calculations (ABO match, HLA allele mismatch score, urgency, and accumulated waiting days) will be processed by the Phase 3 matching engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
