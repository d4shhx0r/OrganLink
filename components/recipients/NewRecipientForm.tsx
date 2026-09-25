"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  recipientSchema,
  type RecipientFormData,
} from "@/lib/validations/entities";
import { createRecipientAction } from "@/app/actions/organlink-actions";
import { BLOOD_GROUPS, ORGAN_TYPES } from "@/lib/types/organlink";

export function NewRecipientForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientSchema),
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      gender: "Male",
      blood_group: "O+",
      tissue_type: "HLA-A*01, HLA-B*08, HLA-DRB1*03",
      required_organ: "kidney",
      location: "",
      medical_urgency: "routine",
    },
  });

  const onSubmit = async (data: RecipientFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await createRecipientAction(data);
      if (!res.success) {
        setFormError(res.error || "Failed to submit recipient record.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/app/recipients/${res.recipientId}`);
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
          href="/app/recipients"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recipients</span>
        </Link>
        <h2 className="text-xl font-semibold text-[#171717] tracking-tight">
          Register Recipient / Patient
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Enter patient clinical profile, compatibility markers, and organ requirement to join the waiting list.
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
          label="Patient Full Name"
          placeholder="e.g. Samuel Bennett"
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
              Required Organ
            </label>
            <select
              {...register("required_organ")}
              className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
            >
              {ORGAN_TYPES.map((ot) => (
                <option key={ot.value} value={ot.value}>
                  {ot.label}
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
            placeholder="e.g. HLA-A*01, HLA-B*08, HLA-DRB1*03"
            error={errors.tissue_type?.message}
            {...register("tissue_type")}
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B5563]">
              Medical Urgency (Research Category)
            </label>
            <select
              {...register("medical_urgency")}
              className="w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none"
            >
              <option value="routine">Routine</option>
              <option value="status_2_urgent">Status 2 (Urgent)</option>
              <option value="status_1_critical">Status 1 (Critical)</option>
            </select>
          </div>
        </div>

        <AuthInput
          label="Hospital / Treatment Center Location"
          placeholder="e.g. University Transplant Center, Floor 5"
          error={errors.location?.message}
          {...register("location")}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting Patient Record..." : "Register Patient onto Waiting List"}
          </Button>
        </div>
      </form>
    </div>
  );
}
