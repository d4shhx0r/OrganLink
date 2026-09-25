import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Activity, ShieldCheck, Clock } from "lucide-react";
import { OrganStatusUpdate } from "@/components/organs/OrganStatusUpdate";
import type { Organ, AppRole, Donor } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

interface OrganDetailPageProps {
  params: { id: string };
}

export default async function OrganDetailPage({ params }: OrganDetailPageProps) {
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

  // Fetch organ along with donor information
  const { data: organData, error } = await supabase
    .from("organs")
    .select("*, donors(*)")
    .eq("id", params.id)
    .single();

  if (error || !organData) {
    notFound();
  }

  const organ = organData as Organ & { donors: Donor | null };
  const isAuthorized = role === "admin" || role === "hospital";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/app/organs"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organs</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#7C00D9]/10 text-[#7C00D9]">
                {organ.organ_reference}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  organ.availability_status === "available"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : organ.availability_status === "reserved"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : organ.availability_status === "allocated"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {organ.availability_status}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#171717] tracking-tight mt-1 capitalize">
              {organ.organ_type} (Procured Organ Record)
            </h1>
          </div>
        </div>
      </div>

      {/* Clinical Specifications */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-6">
        <h2 className="text-base font-semibold text-[#171717] border-b border-[#F3F4F6] pb-3">
          Organ Specifications &amp; Compatibility Factors
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[#6B7280] block mb-1">Blood Group</span>
            <span className="text-sm font-semibold text-[#171717]">
              {organ.blood_group}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Tissue Typing (HLA)</span>
            <span className="text-sm font-mono text-[#171717]">
              {organ.tissue_type}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Preservation Location</span>
            <span className="text-sm font-medium text-[#171717]">
              {organ.location}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Harvested / Available At</span>
            <span className="text-sm font-medium text-[#171717]">
              {new Date(organ.available_at).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Cold Ischemia Expiry</span>
            <span className="text-sm font-medium text-[#171717]">
              {organ.expiry_at
                ? new Date(organ.expiry_at).toLocaleString()
                : "Not explicitly logged"}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Associated Donor</span>
            {organ.donors ? (
              <Link
                href={`/app/donors/${organ.donors.id}`}
                className="text-sm font-medium text-[#7C00D9] hover:underline"
              >
                {organ.donors.full_name} ({organ.donors.donor_reference})
              </Link>
            ) : (
              <span className="text-sm text-[#6B7280]">Donor ID: {organ.donor_id.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Actions */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#7C00D9]" />
          <h2 className="text-base font-semibold text-[#171717]">
            Lifecycle Availability Management
          </h2>
        </div>
        <p className="text-xs text-[#6B7280]">
          Update the organ state as it progresses through procurement, reservation, allocation, or transplantation.
        </p>

        <OrganStatusUpdate
          organId={organ.id}
          currentStatus={organ.availability_status}
          isAuthorized={isAuthorized}
        />
      </div>
    </div>
  );
}
