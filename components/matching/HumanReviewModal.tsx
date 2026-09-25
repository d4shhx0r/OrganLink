"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, X, Loader2, ShieldAlert } from "lucide-react";
import { recordMatchingReviewAction } from "@/app/actions/matching-actions";
import type { CandidateRanking } from "@/lib/matching/types";

interface HumanReviewModalProps {
  matchingRunId: string;
  candidate: CandidateRanking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function HumanReviewModal({
  matchingRunId,
  candidate,
  onClose,
  onSuccess,
}: HumanReviewModalProps) {
  const [decision, setDecision] = useState<
    "reviewed" | "selected_for_research_demo" | "not_selected_for_research_demo"
  >("reviewed");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await recordMatchingReviewAction({
        matchingRunId,
        selectedRecipientId: candidate.recipient.id,
        decision,
        notes: notes || undefined,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to record human review.",
        });
        setIsSubmitting(false);
        return;
      }

      setFeedback({
        type: "success",
        message: "Human review recorded successfully. Cryptographic audit block appended.",
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#7C00D9]">
              Rank #{candidate.rank} &bull; Score: {candidate.score}
            </span>
            <h3 className="text-base font-semibold text-[#171717]">
              Human Clinical Review
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F3F4F6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Research boundary alert */}
        <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] text-xs text-[#6B21A8] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-[#7C00D9] shrink-0 mt-0.5" />
          <span>
            <strong>Research Prototype Boundary:</strong> OrganLink explicitly separates algorithmic ranking from clinical responsibility. Recording a review does not perform automatic medical allocation.
          </span>
        </div>

        {/* Candidate Profile Summary */}
        <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Patient:</span>
            <span className="font-semibold text-[#171717]">
              {candidate.recipient.full_name} ({candidate.recipient.recipient_reference})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Blood / Urgency:</span>
            <span className="text-[#171717]">
              {candidate.recipient.blood_group} &bull; {candidate.recipient.medical_urgency.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-medium text-[#4B5563]">
              Review Decision
            </label>
            <select
              value={decision}
              onChange={(e) =>
                setDecision(
                  e.target.value as
                    | "reviewed"
                    | "selected_for_research_demo"
                    | "not_selected_for_research_demo"
                )
              }
              className="w-full h-11 px-3 rounded-xl bg-[#F1F3F3] text-xs text-[#171717] border border-transparent focus:border-[#7C00D9] focus:outline-none"
            >
              <option value="reviewed">
                Reviewed (Acknowledge candidate evaluation)
              </option>
              <option value="selected_for_research_demo">
                Selected for Research Demonstration
              </option>
              <option value="not_selected_for_research_demo">
                Not Selected for Research Demonstration
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-[#4B5563]">
              Reviewer Clinical Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified crossmatch compatibility and recipient clinical readiness."
              className="w-full p-3 rounded-xl bg-[#F1F3F3] text-xs text-[#171717] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B7280] hover:text-[#171717] hover:bg-[#F3F4F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] disabled:opacity-50 transition-all"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Human Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
