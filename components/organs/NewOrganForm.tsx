"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthInput } from "@/components/auth/AuthInput";
import { organSchema, type OrganFormData } from "@/lib/validations/entities";
import { registerOrganAction } from "@/app/actions/organlink-actions";
import { BLOOD_GROUPS, ORGAN_TYPES, type Donor } from "@/lib/types/organlink";

interface NewOrganFormProps {
  approvedDonors: Donor[];
}

export function NewOrganForm({ approvedDonors }: NewOrganFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDonorId = searchParams.get("donorId") || "";

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDonor =
    approvedDonors.find((d) => d.id === preselectedDonorId) ||
    approvedDonors[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrganFormData>({
    resolver: zodResolver(organSchema),
    defaultValues: {
      organ_type: "kidney",
      donor_id: defaultDonor?.id || "",
      blood_group: defaultDonor?.blood_group || "O+",
      tissue_type: defaultDonor?.tissue_type || "",
      location: defaultDonor?.location || "",
      available_at: new Date().toISOString().slice(0, 16),
      expiry_at: null,
    },
  });

  const selectedDonorId = watch("donor_id");

  // When donor changes, auto-populate blood group, tissue type, and location from donor
  const handleDonorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setValue("donor_id", id);
    const donor = approvedDonors.find((d) => d.id === id);
    if (donor) {
      setValue("blood_group", donor.blood_group);
      setValue("tissue_type", donor.tissue_type);
      setValue("location", donor.location);
    }
  };

  const onSubmit = async (data: OrganFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await registerOrganAction(data);
      if (!res.success) {
        setFormError(res.error || "Failed to register available organ.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/app/organs/${res.organId}`);
      router.refresh();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (approvedDonors.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-subtle text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-[#171717]">
          No Approved Donors Available
        </h2>
        <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
          Per the research protocol, organs can only be registered for clinically verified and approved donors.
        </p>
        <Link
          href="/app/donors"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
        >
          Review Pending Donors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-subtle">
      <div className="mb-6">
        <Link
          href="/app/organs"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organs</span>
        </Link>
        <h2 className="text-xl font-semibold text-[#171717] tracking-tight">
          Register Available Organ
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Record procured organ details linked to an approved donor for compatibility evaluation.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Approved Donor Selector */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#4B5563]">
            Associated Approved Donor
          </label>
          <select
            value={selectedDonorId}
            onChange={handleDonorChange}
            className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
          >
            {approvedDonors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} ({d.donor_reference}) &bull; {d.blood_group} &bull; {d.location}
              </option>
            ))}
          </select>
          {errors.donor_id && (
            <p className="text-xs text-red-600">{errors.donor_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B5563]">
              Organ Type
            </label>
            <select
              {...register("organ_type")}
              className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
            >
              {ORGAN_TYPES.map((ot) => (
                <option key={ot.value} value={ot.value}>
                  {ot.label} (max ~{ot.maxIschemiaHours}h)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B5563]">
              ABO Blood Group
            </label>
            <select
              {...register("blood_group")}
              className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label="Tissue Typing (HLA Profile)"
            error={errors.tissue_type?.message}
            {...register("tissue_type")}
          />

          <AuthInput
            label="Preservation / Procurement Location"
            error={errors.location?.message}
            {...register("location")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label="Available At (Timestamp)"
            type="datetime-local"
            error={errors.available_at?.message}
            {...register("available_at")}
          />

          <AuthInput
            label="Cold Ischemia Expiry (Optional)"
            type="datetime-local"
            error={errors.expiry_at?.message}
            {...register("expiry_at")}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Registering Organ..." : "Register Available Organ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
