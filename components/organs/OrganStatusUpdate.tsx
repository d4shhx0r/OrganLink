"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateOrganStatusAction } from "@/app/actions/organlink-actions";
import type { OrganAvailabilityStatus } from "@/lib/types/organlink";

interface OrganStatusUpdateProps {
  organId: string;
  currentStatus: OrganAvailabilityStatus;
  isAuthorized: boolean;
}

export function OrganStatusUpdate({
  organId,
  currentStatus,
  isAuthorized,
}: OrganStatusUpdateProps) {
  const [status, setStatus] = useState<OrganAvailabilityStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!isAuthorized) {
    return (
      <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#6B7280]">
        Organ availability transitions are restricted to authorized clinical staff.
      </div>
    );
  }

  const handleUpdate = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await updateOrganStatusAction({
        organId,
        status,
        notes: `Clinical availability transition to ${status}`,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update organ status.",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Organ availability updated to "${status}". Cryptographic audit block created.`,
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
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrganAvailabilityStatus)}
          className="h-10 px-3 rounded-xl bg-[#F1F3F3] text-xs text-[#171717] border border-transparent focus:border-[#7C00D9] focus:outline-none"
        >
          <option value="available">available</option>
          <option value="reserved">reserved</option>
          <option value="allocated">allocated</option>
          <option value="transplanted">transplanted</option>
          <option value="unavailable">unavailable</option>
        </select>

        <button
          type="button"
          disabled={loading || status === currentStatus}
          onClick={handleUpdate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] disabled:opacity-50 transition-all"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Update Availability Status</span>
        </button>
      </div>
    </div>
  );
}
