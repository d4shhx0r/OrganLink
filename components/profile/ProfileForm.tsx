"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from "@/lib/validations/entities";
import { updateProfileAction } from "@/app/actions/organlink-actions";
import type { Profile } from "@/lib/types/organlink";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      blood_group: profile.blood_group || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await updateProfileAction(data);
      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update profile.",
        });
      } else {
        setFeedback({
          type: "success",
          message: "Profile information updated successfully.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-subtle space-y-6">
      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Account System Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] text-xs">
        <div>
          <span className="text-[#6B7280] block mb-1">Email (Authenticated)</span>
          <span className="font-semibold text-[#171717]">{profile.email}</span>
        </div>

        <div>
          <span className="text-[#6B7280] block mb-1">Role (RBAC Bound)</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#7C00D9] capitalize">
              {profile.role}
            </span>
            <span title="Role is locked">
              <Lock className="w-3 h-3 text-[#9CA3AF]" />
            </span>
          </div>
        </div>

        <div>
          <span className="text-[#6B7280] block mb-1">Account Created</span>
          <span className="text-[#171717]">
            {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Editable Fields Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthInput
          label="Full Name"
          placeholder="Your full name"
          error={errors.full_name?.message}
          {...register("full_name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label="Contact Phone"
            placeholder="+1 555-0100"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <AuthInput
            label="Blood Group (Optional)"
            placeholder="e.g. O+"
            error={errors.blood_group?.message}
            {...register("blood_group")}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-6"
          >
            {isSubmitting ? "Saving Changes..." : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
