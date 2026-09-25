import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, HeartHandshake, ShieldCheck, Clock, Activity, Plus } from "lucide-react";
import { DonorApprovalActions } from "@/components/donors/DonorApprovalActions";
import type { Donor, AppRole, Organ } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

interface DonorDetailPageProps {
  params: { id: string };
}

export default async function DonorDetailPage({ params }: DonorDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  // Fetch donor
  const { data: donorData, error: donorErr } = await supabase
    .from("donors")
    .select("*")
    .eq("id", params.id)
    .single();

  if (donorErr || !donorData) {
    notFound();
  }

  const donor = donorData as Donor;

  // Fetch registered organs associated with this donor
  let associatedOrgans: Organ[] = [];
  try {
    const { data: organs } = await supabase
      .from("organs")
      .select("*")
      .eq("donor_id", donor.id);
    associatedOrgans = (organs as Organ[]) || [];
  } catch {
    associatedOrgans = [];
  }

  const isAuthorizedToReview = role === "admin" || role === "hospital";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/app/donors"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Donors</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#7C00D9]/10 text-[#7C00D9]">
                {donor.donor_reference}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  donor.approval_status === "approved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : donor.approval_status === "rejected"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {donor.approval_status}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#171717] tracking-tight mt-1">
              {donor.full_name}
            </h1>
          </div>

          {/* Quick link to register organ if donor is approved */}
          {donor.approval_status === "approved" && isAuthorizedToReview && (
            <Link
              href={`/app/organs/new?donorId=${donor.id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Procured Organ</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-6">
        <h2 className="text-base font-semibold text-[#171717] border-b border-[#F3F4F6] pb-3">
          Donor Profile &amp; Clinical Compatibility
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[#6B7280] block mb-1">Blood Group</span>
            <span className="text-sm font-semibold text-[#171717]">
              {donor.blood_group}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Tissue Typing (HLA)</span>
            <span className="text-sm font-mono text-[#171717]">
              {donor.tissue_type}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Gender / DOB</span>
            <span className="text-sm font-medium text-[#171717]">
              {donor.gender} &bull; {donor.date_of_birth}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Facility / Location</span>
            <span className="text-sm font-medium text-[#171717]">
              {donor.location}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Consent Status</span>
            <span className="text-sm font-medium capitalize text-emerald-600">
              {donor.consent_status}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Registration Date</span>
            <span className="text-sm font-medium text-[#171717]">
              {new Date(donor.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {donor.contact_information && (
          <div className="pt-4 border-t border-[#F3F4F6] text-xs">
            <span className="text-[#6B7280] block mb-1">Contact Reference</span>
            <p className="text-[#171717]">{donor.contact_information}</p>
          </div>
        )}
      </div>

      {/* Approval Review Section */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#7C00D9]" />
          <h2 className="text-base font-semibold text-[#171717]">
            Hospital Approval Review
          </h2>
        </div>
        <p className="text-xs text-[#6B7280]">
          Approval establishes verification in the research registry. Organs can only be registered for approved donors.
        </p>

        <DonorApprovalActions
          donorId={donor.id}
          currentStatus={donor.approval_status}
          isAuthorized={isAuthorizedToReview}
        />
      </div>

      {/* Associated Available Organs */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#7C00D9]" />
            <h2 className="text-base font-semibold text-[#171717]">
              Registered Available Organs ({associatedOrgans.length})
            </h2>
          </div>
        </div>

        {associatedOrgans.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] py-3">
            No organs currently registered for this donor.
          </p>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {associatedOrgans.map((organ) => (
              <div
                key={organ.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold uppercase text-[#7C00D9]">
                    {organ.organ_type}
                  </span>{" "}
                  &bull; <span className="font-mono text-[#6B7280]">{organ.organ_reference}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 capitalize">
                    {organ.availability_status}
                  </span>
                  <Link
                    href={`/app/organs/${organ.id}`}
                    className="text-[#7C00D9] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
