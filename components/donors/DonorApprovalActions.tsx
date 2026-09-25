"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { reviewDonorApprovalAction } from "@/app/actions/organlink-actions";

interface DonorApprovalActionsProps {
  donorId: string;
  currentStatus: string;
  isAuthorized: boolean;
}

export function DonorApprovalActions({
  donorId,
  currentStatus,
  isAuthorized,
}: DonorApprovalActionsProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!isAuthorized) {
    return (
      <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#6B7280]">
        Approval status can only be modified by authorized hospital clinicians or platform administrators.
      </div>
    );
  }

  const handleDecision = async (decision: "approved" | "rejected") => {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await reviewDonorApprovalAction({
        donorId,
        decision,
        notes: `Clinical review performed via dashboard: marked as ${decision}`,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update donor status.",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Donor successfully ${decision}. Cryptographic audit block appended.`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          role="alert"
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading || currentStatus === "approved"}
          onClick={() => handleDecision("approved")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>Approve Donor Registration</span>
        </button>

        <button
          type="button"
          disabled={loading || currentStatus === "rejected"}
          onClick={() => handleDecision("rejected")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-all"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Reject Registration</span>
        </button>
      </div>
    </div>
  );
}
