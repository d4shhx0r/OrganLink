"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthInput } from "@/components/auth/AuthInput";
import { donorSchema, type DonorFormData } from "@/lib/validations/entities";
import { createDonorAction } from "@/app/actions/organlink-actions";
import { BLOOD_GROUPS } from "@/lib/types/organlink";

export function NewDonorForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonorFormData>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      gender: "Male",
      blood_group: "O+",
      tissue_type: "HLA-A*02, HLA-B*07, HLA-DRB1*04",
      location: "",
      contact_information: "",
      medical_status: "pending_review",
      consent_status: "provided",
    },
  });

  const onSubmit = async (data: DonorFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await createDonorAction(data);
      if (!res.success) {
        setFormError(res.error || "Failed to submit donor registration.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/app/donors/${res.donorId}`);
      router.refresh();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-subtle">
      <div className="mb-6">
        <Link
          href="/app/donors"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Donors</span>
        </Link>
        <h2 className="text-xl font-semibold text-[#171717] tracking-tight">
          Register New Donor
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Record donor profile, compatibility markers, and consent for the research registry.
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
        <AuthInput
          label="Full Name"
          placeholder="e.g. Eleanor Vance"
          error={errors.full_name?.message}
          {...register("full_name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label="Date of Birth"
            type="date"
            error={errors.date_of_birth?.message}
            {...register("date_of_birth")}
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B5563]">
              Gender
            </label>
            <select
              {...register("gender")}
              className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {errors.blood_group && (
              <p className="text-xs text-red-600">{errors.blood_group.message}</p>
            )}
          </div>

          <AuthInput
            label="Tissue Typing (HLA Alleles)"
            placeholder="e.g. HLA-A*02, HLA-B*07, HLA-DRB1*04"
            error={errors.tissue_type?.message}
            {...register("tissue_type")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label="Location / Hospital Facility"
            placeholder="e.g. City General Hospital, Ward 4"
            error={errors.location?.message}
            {...register("location")}
          />

          <AuthInput
            label="Contact Information (Optional)"
            placeholder="e.g. +1 555-0192 or next-of-kin"
            error={errors.contact_information?.message}
            {...register("contact_information")}
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] text-xs text-[#6B7280] space-y-1">
          <span className="font-semibold text-[#171717] block">
            Research Consent &amp; Verification Protocol
          </span>
          <p>
            Submitted donor records enter a <strong>Pending Approval</strong> state. An authorized hospital or administrative user must verify and approve the record before organs can be procured and registered.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting Registration..." : "Submit Donor Record"}
          </Button>
        </div>
      </form>
    </div>
  );
}
