import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle2, XCircle, UserCheck, ShieldCheck } from "lucide-react";
import type { AppRole, Recipient, Organ } from "@/lib/types/organlink";
import type { CandidateFactors } from "@/lib/matching/types";

export const dynamic = "force-dynamic";

interface HistoryDetailPageProps {
  params: { id: string };
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let role: AppRole = "hospital";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role as AppRole;
  } catch {
    role = "hospital";
  }

  if (role !== "admin" && role !== "hospital") {
    redirect("/app/dashboard");
  }

  // Fetch run, organ, results, and reviews
  const [runRes, resultsRes, reviewsRes] = await Promise.all([
    supabase
      .from("matching_runs")
      .select("*, organs(*)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("matching_results")
      .select("*, recipients(*)")
      .eq("matching_run_id", params.id)
      .order("rank", { ascending: true, nullsFirst: false }),
    supabase
      .from("matching_reviews")
      .select("*")
      .eq("matching_run_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (runRes.error || !runRes.data) {
    notFound();
  }

  const run = runRes.data;
  const organ = run.organs as Organ | null;
  const results = (resultsRes.data || []) as Array<{
    id: string;
    eligible: boolean;
    score: number | null;
    rank: number | null;
    exclusion_reason: string | null;
    factor_breakdown: CandidateFactors;
    recipients: Recipient | null;
  }>;
  const reviews = reviewsRes.data || [];

  const rankedResults = results.filter((r) => r.eligible);
  const excludedResults = results.filter((r) => !r.eligible);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/app/matching/history"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Matching History</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#7C00D9]/10 text-[#7C00D9]">
                {run.algorithm_version}
              </span>
              <span className="text-xs text-[#6B7280]">
                Executed {new Date(run.generated_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#171717] tracking-tight mt-1">
              Matching Run Inspection ({organ?.organ_reference || "Organ"})
            </h1>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-subtle space-y-3">
        <h2 className="text-sm font-semibold text-[#171717] border-b border-[#F3F4F6] pb-2">
          Algorithm Weight Configuration
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#6B7280] block mb-0.5">Blood Compatibility</span>
            <span className="font-semibold text-[#171717]">
              {(run.configuration.bloodCompatibility * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block mb-0.5">Tissue Typing (HLA)</span>
            <span className="font-semibold text-[#171717]">
              {(run.configuration.tissueCompatibility * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block mb-0.5">Medical Urgency</span>
            <span className="font-semibold text-[#171717]">
              {(run.configuration.urgency * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block mb-0.5">Waiting Time</span>
            <span className="font-semibold text-[#171717]">
              {(run.configuration.waitingTime * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recorded Human Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-[#171717]">
              Recorded Clinical Reviews ({reviews.length})
            </h2>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-semibold capitalize text-[#171717]">
                    {rev.decision.replace(/_/g, " ")}
                  </span>
                  {rev.notes && (
                    <span className="text-[#6B7280] block text-[11px] mt-0.5">
                      Notes: {rev.notes}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#9CA3AF]">
                  {new Date(rev.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranked Candidate Results */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-[#F3F4F6] font-semibold text-xs text-[#171717]">
          Ranked Candidates ({rankedResults.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium">
              <tr>
                <th className="py-3 px-4 w-14">Rank</th>
                <th className="py-3 px-4">Patient Candidate</th>
                <th className="py-3 px-4">Research Score</th>
                <th className="py-3 px-4">Blood Match</th>
                <th className="py-3 px-4">Tissue Concordance</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Waiting Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
              {rankedResults.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-bold">#{r.rank}</td>
                  <td className="py-3 px-4 font-medium">
                    {r.recipients?.full_name}{" "}
                    <span className="font-mono text-[11px] text-[#7C00D9]">
                      ({r.recipients?.recipient_reference})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#7C00D9]">{r.score} / 100</td>
                  <td className="py-3 px-4 text-emerald-700">✓ Compatible</td>
                  <td className="py-3 px-4 capitalize">
                    {r.factor_breakdown?.tissue?.matchLevel?.replace(/_/g, " ") || "baseline"}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {r.recipients?.medical_urgency?.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4">
                    {r.factor_breakdown?.waitingTime?.waitingDays} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excluded Section */}
      {excludedResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-subtle space-y-2 text-xs">
          <h3 className="font-semibold text-amber-700">
            Excluded Candidates ({excludedResults.length})
          </h3>
          <div className="divide-y divide-[#F3F4F6]">
            {excludedResults.map((exc) => (
              <div key={exc.id} className="py-2 flex items-center justify-between">
                <span>
                  {exc.recipients?.full_name} ({exc.recipients?.recipient_reference})
                </span>
                <span className="text-red-700 font-medium">
                  ✕ {exc.exclusion_reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
