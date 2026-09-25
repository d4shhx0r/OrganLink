import type { Organ, Recipient } from "@/lib/types/organlink";
import { isABOCompatible } from "./abo-compatibility";
import { evaluateTissueCompatibility } from "./tissue-compatibility";
import { evaluateMedicalUrgency } from "./urgency";
import { evaluateWaitingTime } from "./waiting-time";
import { scoreCandidate } from "./scoring";
import {
  ALGORITHM_VERSION,
  DEFAULT_MATCHING_WEIGHTS,
  type MatchingWeights,
} from "./config";
import type {
  CandidateFactors,
  CandidateRanking,
  MatchingEngineResult,
} from "./types";

/**
 * OrganLink Deterministic Research Matching Engine
 * 
 * Takes an available organ and a pool of recipient candidates,
 * evaluates clinical research factors (ABO, HLA, Urgency, Waiting Time),
 * enforces hard exclusions, and deterministically ranks eligible candidates.
 */
export function runMatchingEngine(
  organ: Organ,
  recipients: Recipient[],
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  referenceDateUtc: Date = new Date()
): MatchingEngineResult {
  const ranked: CandidateRanking[] = [];
  const excluded: CandidateRanking[] = [];

  for (const recipient of recipients) {
    // 1. Evaluate individual criteria
    const bloodResult = isABOCompatible(organ.blood_group, recipient.blood_group);
    const tissueResult = evaluateTissueCompatibility(organ.tissue_type, recipient.tissue_type);
    const urgencyResult = evaluateMedicalUrgency(recipient.medical_urgency);
    const waitingResult = evaluateWaitingTime(recipient.waiting_since, referenceDateUtc);

    const factors: CandidateFactors = {
      blood: bloodResult,
      tissue: tissueResult,
      urgency: urgencyResult,
      waitingTime: waitingResult,
    };

    // 2. Score candidate & check hard constraints
    const candidateScore = scoreCandidate(organ, recipient, factors, weights);

    if (candidateScore.eligible) {
      ranked.push(candidateScore);
    } else {
      excluded.push(candidateScore);
    }
  }

  // 3. Deterministic Sorting:
  // - 1st: Score descending
  // - 2nd: Urgency score descending
  // - 3rd: Waiting days descending
  // - 4th: Recipient reference alphabetically ascending (tie-breaker)
  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.factors.urgency.score !== a.factors.urgency.score) {
      return b.factors.urgency.score - a.factors.urgency.score;
    }
    if (b.factors.waitingTime.waitingDays !== a.factors.waitingTime.waitingDays) {
      return b.factors.waitingTime.waitingDays - a.factors.waitingTime.waitingDays;
    }
    return a.recipient.recipient_reference.localeCompare(b.recipient.recipient_reference);
  });

  // 4. Assign sequential integer ranks
  ranked.forEach((candidate, index) => {
    candidate.rank = index + 1;
  });

  return {
    organ,
    runTimestamp: referenceDateUtc.toISOString(),
    algorithmVersion: ALGORITHM_VERSION,
    weights,
    rankedCandidates: ranked,
    excludedCandidates: excluded,
    totalEvaluated: recipients.length,
  };
}
