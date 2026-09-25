"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Loader2, History, AlertCircle, Sparkles } from "lucide-react";
import { OrganSelector } from "./OrganSelector";
import { CandidateRankingTable } from "./CandidateRankingTable";
import { HumanReviewModal } from "./HumanReviewModal";
import { executeMatchingRunAction } from "@/app/actions/matching-actions";
import type { Organ } from "@/lib/types/organlink";
import type {
  MatchingEngineResult,
  CandidateRanking,
} from "@/lib/matching/types";

interface MatchingDashboardViewProps {
  availableOrgans: Organ[];
  initialOrganId?: string;
}

export function MatchingDashboardView({
  availableOrgans,
  initialOrganId = "",
}: MatchingDashboardViewProps) {
  const [selectedOrganId, setSelectedOrganId] = useState<string>(
    initialOrganId || (availableOrgans[0]?.id || "")
  );
  const [isRunning, setIsRunning] = useState(false);
  const [matchingResult, setMatchingResult] = useState<
    (MatchingEngineResult & { matchingRunId: string }) | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review modal state
  const [reviewCandidate, setReviewCandidate] = useState<CandidateRanking | null>(null);

  const handleRunMatching = async () => {
    if (!selectedOrganId) return;

    setIsRunning(true);
    setErrorMessage(null);

    try {
      const res = await executeMatchingRunAction(selectedOrganId);

      if (!res.success || !res.result) {
        setErrorMessage(res.error || "Failed to execute matching run.");
        setMatchingResult(null);
      } else {
        setMatchingResult(res.result);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while executing the matching engine.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
            Transparent Organ Matching
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Deterministic candidate ranking based on ABO compatibility, HLA tissue typing, medical urgency, and waiting time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/matching/history"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-all"
          >
            <History className="w-3.5 h-3.5" />
            <span>Matching History</span>
          </Link>

          <button
            type="button"
            disabled={!selectedOrganId || isRunning}
            onClick={handleRunMatching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] disabled:opacity-50 transition-all shadow-sm"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? "Evaluating candidates..." : "Run Matching Engine"}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Organ Selector Section */}
      <OrganSelector
        availableOrgans={availableOrgans}
        selectedOrganId={selectedOrganId}
        onSelectOrgan={(id) => {
          setSelectedOrganId(id);
          setMatchingResult(null); // Reset current matching run view when organ switches
        }}
      />

      {/* Matching Results Section */}
      {matchingResult && (
        <div className="space-y-6 animate-in fade-in">
          <CandidateRankingTable
            rankedCandidates={matchingResult.rankedCandidates}
            excludedCandidates={matchingResult.excludedCandidates}
            onOpenReview={(candidate) => setReviewCandidate(candidate)}
          />
        </div>
      )}

      {/* Human Review Modal */}
      {reviewCandidate && matchingResult && (
        <HumanReviewModal
          matchingRunId={matchingResult.matchingRunId}
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onSuccess={() => {
            // refresh state if needed
          }}
        />
      )}
    </div>
  );
}
