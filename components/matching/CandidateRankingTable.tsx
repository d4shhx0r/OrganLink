"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import type { CandidateRanking } from "@/lib/matching/types";

interface CandidateRankingTableProps {
  rankedCandidates: CandidateRanking[];
  excludedCandidates: CandidateRanking[];
  onOpenReview: (candidate: CandidateRanking) => void;
}

export function CandidateRankingTable({
  rankedCandidates,
  excludedCandidates,
  onOpenReview,
}: CandidateRankingTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Top Section Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#171717] tracking-tight">
            2. Candidate Matching Results &amp; Ranking
          </h2>
          <p className="text-xs text-[#6B7280]">
            Deterministic scoring based on ABO compatibility (40%), tissue typing (30%), urgency (20%), and waiting time (10%).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            {rankedCandidates.length} Ranked
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            {excludedCandidates.length} Excluded
          </span>
        </div>
      </div>

      {/* Ranked Candidates Table / Cards */}
      {rankedCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
          <Info className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#171717]">
            No Eligible Recipients Found
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            No active waiting list patients matched the organ type with compatible ABO status.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium">
                <tr>
                  <th className="py-3.5 px-4 w-16">Rank</th>
                  <th className="py-3.5 px-4">Patient Candidate</th>
                  <th className="py-3.5 px-4">Research Score</th>
                  <th className="py-3.5 px-4">ABO Match</th>
                  <th className="py-3.5 px-4">HLA Match</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Waiting Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {rankedCandidates.map((c) => {
                  const isExpanded = expandedRow === c.recipient.id;

                  return (
                    <React.Fragment key={c.recipient.id}>
                      <tr className="hover:bg-[#FBFBFB] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-sm">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                              c.rank === 1
                                ? "bg-[#7C00D9] text-white"
                                : c.rank === 2
                                ? "bg-[#7C00D9]/15 text-[#7C00D9]"
                                : "bg-gray-100 text-[#4B5563]"
                            }`}
                          >
                            #{c.rank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold block text-[#171717]">
                            {c.recipient.full_name}
                          </span>
                          <span className="font-mono text-[11px] text-[#7C00D9]">
                            {c.recipient.recipient_reference}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#171717]">
                              {c.score}
                            </span>
                            <span className="text-[11px] text-[#9CA3AF]">/ 100</span>
                          </div>
                          <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-[#7C00D9] h-full rounded-full"
                              style={{ width: `${Math.min(100, c.score)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{c.recipient.blood_group} (✓ Compatible)</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              c.factors.tissue.matchLevel === "exact"
                                ? "text-emerald-700"
                                : c.factors.tissue.matchLevel === "partial"
                                ? "text-purple-700"
                                : c.factors.tissue.matchLevel === "insufficient_data"
                                ? "text-amber-700"
                                : "text-red-700"
                            }`}
                          >
                            {c.factors.tissue.matchLevel === "exact" && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {c.factors.tissue.matchLevel === "partial" && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {c.factors.tissue.matchLevel === "insufficient_data" && (
                              <HelpCircle className="w-3.5 h-3.5" />
                            )}
                            {c.factors.tissue.matchLevel === "mismatch" && (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span className="capitalize">
                              {c.factors.tissue.matchLevel.replace(/_/g, " ")}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                              c.recipient.medical_urgency === "status_1_critical"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : c.recipient.medical_urgency === "status_2_urgent"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {c.recipient.medical_urgency.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#4B5563]">
                          <span>{c.factors.waitingTime.waitingDays} days</span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(c.recipient.id)}
                              className="p-1 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F3F4F6]"
                              title="Toggle explanation breakdown"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenReview(c)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#7C00D9]/10 text-[#7C00D9] hover:bg-[#7C00D9] hover:text-white transition-all flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Explanation Dropdown Row */}
                      {isExpanded && (
                        <tr className="bg-[#FAF5FF]/50 border-y border-[#F3F4F6]">
                          <td colSpan={8} className="p-4">
                            <div className="space-y-2 text-xs">
                              <span className="font-semibold text-[#171717] block">
                                Transparent Factor Decomposition for #{c.rank} ({c.recipient.recipient_reference}):
                              </span>
                              <ul className="list-disc pl-5 space-y-1 text-[#4B5563]">
                                {c.explanations.map((exp, i) => (
                                  <li key={i}>{exp}</li>
                                ))}
                              </ul>
                              <div className="pt-1 flex items-center gap-4 text-[11px] text-[#6B7280]">
                                <span>Facility: {c.recipient.location}</span>
                                <span>&bull;</span>
                                <span>DOB: {c.recipient.date_of_birth}</span>
                                <span>&bull;</span>
                                <Link
                                  href={`/app/recipients/${c.recipient.id}`}
                                  className="text-[#7C00D9] hover:underline"
                                >
                                  Open Patient File &rarr;
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Excluded Candidates Section */}
      {excludedCandidates.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-[#171717]">
              Excluded Candidates ({excludedCandidates.length})
            </h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            The following patients matched organ type but failed primary criteria (e.g. major ABO mismatch or non-active status):
          </p>

          <div className="divide-y divide-[#F3F4F6]">
            {excludedCandidates.map((exc) => (
              <div
                key={exc.recipient.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
              >
                <div>
                  <span className="font-semibold text-[#171717]">
                    {exc.recipient.full_name}
                  </span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-[#7C00D9]">
                    {exc.recipient.recipient_reference}
                  </span>{" "}
                  ({exc.recipient.blood_group})
                </div>
                <div className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded text-[11px]">
                  ✕ {exc.exclusionReason || "Excluded from primary ranking"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
