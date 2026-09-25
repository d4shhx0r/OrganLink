import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, History, ArrowRight, Activity, GitCompare } from "lucide-react";
import type { AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function MatchingHistoryPage() {
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

  // Fetch past matching runs joined with organ details
  let runs: Array<{
    id: string;
    organ_id: string;
    algorithm_version: string;
    candidate_count: number;
    eligible_count: number;
    generated_at: string;
    organs?: {
      organ_reference: string;
      organ_type: string;
      blood_group: string;
    } | null;
  }> = [];

  try {
    const { data } = await supabase
      .from("matching_runs")
      .select("*, organs(organ_reference, organ_type, blood_group)")
      .order("generated_at", { ascending: false })
      .limit(50);
    runs = (data as typeof runs) || [];
  } catch (err) {
    console.error("[Matching History] Query error:", err);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/app/matching"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#171717] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organ Matching</span>
        </Link>
        <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
          Matching Execution History
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Historical log of reproducible matching engine runs, algorithm versions, and candidate ranking distributions
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-subtle">
          <History className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#171717]">
            No matching runs recorded yet
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            When authorized clinical personnel run candidate evaluations on available organs, reproducible records will be cataloged here.
          </p>
          <Link
            href="/app/matching"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Initiate Matching Run</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium">
                <tr>
                  <th className="py-3.5 px-4">Run Timestamp</th>
                  <th className="py-3.5 px-4">Organ Reference</th>
                  <th className="py-3.5 px-4">Algorithm Version</th>
                  <th className="py-3.5 px-4">Total Evaluated</th>
                  <th className="py-3.5 px-4">Ranked Candidates</th>
                  <th className="py-3.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-[#FBFBFB] transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#4B5563]">
                      {new Date(run.generated_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#171717]">
                      {run.organs ? (
                        <span>
                          {run.organs.organ_reference}{" "}
                          <span className="uppercase text-[11px] font-normal text-[#6B7280]">
                            ({run.organs.organ_type} &bull; {run.organs.blood_group})
                          </span>
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-[#6B7280]">
                          Organ ID: {run.organ_id.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#7C00D9]">
                      {run.algorithm_version}
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {run.candidate_count} candidates
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                        {run.eligible_count} eligible
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/matching/history/${run.id}`}
                        className="inline-flex items-center gap-1 text-[#7C00D9] hover:underline font-medium"
                      >
                        <span>Inspect Results</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
