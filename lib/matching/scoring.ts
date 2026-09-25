import type { CandidateFactors, CandidateRanking } from "./types";
import type { MatchingWeights } from "./config";
import type { Recipient, Organ } from "@/lib/types/organlink";

/**
 * Computes normalized 0–100 OrganLink Research Matching Score.
 * Enforces hard constraints:
 * - Organ type mismatch => Ineligible / Excluded
 * - Recipient non-active status => Ineligible / Excluded
 * - Major ABO incompatibility => Ineligible / Excluded from primary ranking
 */
export function scoreCandidate(
  organ: Organ,
  recipient: Recipient,
  factors: CandidateFactors,
  weights: MatchingWeights
): CandidateRanking {
  const explanations: string[] = [];

  // 1. Check Hard Constraints
  if (recipient.required_organ !== organ.organ_type) {
    return {
      recipient,
      eligible: false,
      score: 0,
      rank: null,
      factors,
      explanations: [
        `Organ Mismatch: Patient requires ${recipient.required_organ}, but available organ is ${organ.organ_type}.`,
      ],
      exclusionReason: `Organ type mismatch (Requires: ${recipient.required_organ})`,
    };
  }

  if (recipient.status !== "active") {
    return {
      recipient,
      eligible: false,
      score: 0,
      rank: null,
      factors,
      explanations: [
        `Patient status is "${recipient.status}". Only active patients can be considered for matching.`,
      ],
      exclusionReason: `Non-active patient status (${recipient.status})`,
    };
  }

  if (!factors.blood.compatible) {
    return {
      recipient,
      eligible: false,
      score: 0,
      rank: null,
      factors,
      explanations: [factors.blood.reason],
      exclusionReason: `Major ABO incompatibility (${organ.blood_group} \u2192 ${recipient.blood_group})`,
    };
  }

  // 2. Compute Weighted Composite Score (0.0 to 1.0)
  const weightedSum =
    factors.blood.score * weights.bloodCompatibility +
    factors.tissue.score * weights.tissueCompatibility +
    factors.urgency.score * weights.urgency +
    factors.waitingTime.score * weights.waitingTime;

  // Scale to 0–100 and round to 1 decimal place
  const finalScore = Number((weightedSum * 100).toFixed(1));

  // Build transparent factor explanations
  explanations.push(
    `ABO: ${factors.blood.reason} (factor: ${(factors.blood.score * 100).toFixed(0)}%, weight: ${(weights.bloodCompatibility * 100).toFixed(0)}%)`
  );
  explanations.push(
    `Tissue (HLA): ${factors.tissue.reason} (factor: ${(factors.tissue.score * 100).toFixed(0)}%, weight: ${(weights.tissueCompatibility * 100).toFixed(0)}%)`
  );
  explanations.push(
    `Urgency: ${factors.urgency.reason} (factor: ${(factors.urgency.score * 100).toFixed(0)}%, weight: ${(weights.urgency * 100).toFixed(0)}%)`
  );
  explanations.push(
    `Waiting Time: ${factors.waitingTime.reason} (factor: ${(factors.waitingTime.score * 100).toFixed(0)}%, weight: ${(weights.waitingTime * 100).toFixed(0)}%)`
  );

  return {
    recipient,
    eligible: true,
    score: finalScore,
    rank: null, // Assigned sequentially after deterministic sorting
    factors,
    explanations,
  };
}
