"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { runMatchingEngine } from "@/lib/matching/matching-engine";
import { ALGORITHM_VERSION, DEFAULT_MATCHING_WEIGHTS } from "@/lib/matching/config";
import type { Organ, Recipient, AppRole } from "@/lib/types/organlink";
import type { MatchingEngineResult } from "@/lib/matching/types";

// Helper: Verify authenticated session and clinical/admin authorization
async function getAuthorizedMatchingUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Please sign in to run the matching engine.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const role: AppRole = (profile?.role as AppRole) || "donor";

  if (role !== "admin" && role !== "hospital") {
    throw new Error("Forbidden: Candidate matching is restricted to clinical hospital staff and system administrators.");
  }

  return { supabase, user, role, profile };
}

/**
 * Executes a deterministic matching run for an available organ.
 * Persists the run, individual candidate factor breakdowns, and an immutable cryptographic audit record.
 */
export async function executeMatchingRunAction(organId: string): Promise<{
  success: boolean;
  error?: string;
  result?: MatchingEngineResult & { matchingRunId: string };
}> {
  try {
    const { supabase, user, role } = await getAuthorizedMatchingUser();

    // 1. Fetch available organ
    const { data: organData, error: organErr } = await supabase
      .from("organs")
      .select("*, donors(*)")
      .eq("id", organId)
      .single();

    if (organErr || !organData) {
      return { success: false, error: "Target organ record not found." };
    }

    const organ = organData as Organ;

    if (organ.availability_status !== "available") {
      return {
        success: false,
        error: `Cannot match organ: Current availability status is "${organ.availability_status}". Only "available" organs can be matched.`,
      };
    }

    // 2. Fetch candidate recipients matching organ type and active status
    const { data: recipientsData, error: recErr } = await supabase
      .from("recipients")
      .select("*")
      .eq("required_organ", organ.organ_type)
      .eq("status", "active")
      .order("waiting_since", { ascending: true });

    if (recErr) {
      return { success: false, error: "Failed to retrieve recipient candidate pool." };
    }

    const recipients = (recipientsData as Recipient[]) || [];

    // 3. Execute Deterministic Matching Engine
    const matchingResult = runMatchingEngine(
      organ,
      recipients,
      DEFAULT_MATCHING_WEIGHTS
    );

    // 4. Persist Matching Run in database
    const { data: runData, error: runInsertErr } = await supabase
      .from("matching_runs")
      .insert([
        {
          organ_id: organ.id,
          executed_by: user.id,
          algorithm_version: ALGORITHM_VERSION,
          configuration: DEFAULT_MATCHING_WEIGHTS,
          candidate_count: matchingResult.totalEvaluated,
          eligible_count: matchingResult.rankedCandidates.length,
        },
      ])
      .select()
      .single();

    if (runInsertErr || !runData) {
      console.error("[Matching Action] Failed to insert matching run:", runInsertErr);
      return { success: false, error: "Failed to persist matching run record." };
    }

    const matchingRunId = runData.id;

    // 5. Persist Individual Candidate Results (Ranked & Excluded)
    const allEvaluated = [
      ...matchingResult.rankedCandidates,
      ...matchingResult.excludedCandidates,
    ];

    if (allEvaluated.length > 0) {
      const resultRows = allEvaluated.map((c) => ({
        matching_run_id: matchingRunId,
        recipient_id: c.recipient.id,
        eligible: c.eligible,
        score: c.eligible ? c.score : null,
        factor_breakdown: c.factors,
        exclusion_reason: c.exclusionReason || null,
        rank: c.rank,
      }));

      const { error: resultsErr } = await supabase
        .from("matching_results")
        .insert(resultRows);

      if (resultsErr) {
        console.error("[Matching Action] Error saving matching results:", resultsErr);
      }
    }

    // 6. Cryptographic Audit Event (Enters existing SHA-256 hash chain)
    const topRanked = matchingResult.rankedCandidates[0];
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: role,
      action: "MATCHING_RUN_EXECUTED",
      entityType: "organ",
      entityId: organ.id,
      metadata: {
        matchingRunId,
        organReference: organ.organ_reference,
        organType: organ.organ_type,
        algorithmVersion: ALGORITHM_VERSION,
        totalCandidates: matchingResult.totalEvaluated,
        eligibleRanked: matchingResult.rankedCandidates.length,
        topCandidateReference: topRanked?.recipient.recipient_reference || "None",
        topCandidateScore: topRanked?.score || 0,
      },
    });

    revalidatePath("/app/matching");
    revalidatePath(`/app/matching/${organId}`);
    revalidatePath("/app/matching/history");
    revalidatePath("/app/dashboard");

    return {
      success: true,
      result: {
        ...matchingResult,
        matchingRunId,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute matching run.";
    return { success: false, error: message };
  }
}

/**
 * Records a human clinician review of a generated matching run.
 * Enforces separation between algorithmic ranking and human clinical responsibility.
 */
export async function recordMatchingReviewAction(params: {
  matchingRunId: string;
  selectedRecipientId?: string | null;
  decision: "reviewed" | "selected_for_research_demo" | "not_selected_for_research_demo";
  notes?: string;
}) {
  try {
    const { supabase, user, role } = await getAuthorizedMatchingUser();

    const newReview = {
      matching_run_id: params.matchingRunId,
      selected_recipient_id: params.selectedRecipientId || null,
      reviewer_id: user.id,
      decision: params.decision,
      notes: params.notes || null,
    };

    const { data, error } = await supabase
      .from("matching_reviews")
      .insert([newReview])
      .select()
      .single();

    if (error) {
      return { success: false, error: "Failed to record matching review." };
    }

    // Cryptographic Audit Record for human review
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: role,
      action: "MATCH_REVIEW_RECORDED",
      entityType: "organ",
      entityId: params.matchingRunId,
      metadata: {
        reviewId: data.id,
        decision: params.decision,
        selectedRecipientId: params.selectedRecipientId || null,
        reviewerEmail: user.email,
        notes: params.notes || null,
      },
    });

    revalidatePath(`/app/matching/history/${params.matchingRunId}`);
    revalidatePath("/app/matching/history");
    revalidatePath("/app/matching");

    return { success: true, reviewId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record human review.";
    return { success: false, error: message };
  }
}
