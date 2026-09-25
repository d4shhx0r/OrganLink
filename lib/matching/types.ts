import type { Organ, Recipient, BloodGroup, MedicalUrgency } from "@/lib/types/organlink";
import type { MatchingWeights } from "./config";

export interface ABOCompatibilityResult {
  compatible: boolean;
  score: number; // 0.0 to 1.0
  reason: string;
}

export type TissueMatchLevel = "exact" | "partial" | "mismatch" | "insufficient_data";

export interface TissueCompatibilityResult {
  score: number; // 0.0 to 1.0
  matchLevel: TissueMatchLevel;
  sharedLoci: string[];
  totalLociChecked: number;
  reason: string;
}

export interface UrgencyResult {
  score: number; // 0.0 to 1.0
  level: MedicalUrgency;
  reason: string;
}

export interface WaitingTimeResult {
  waitingDays: number;
  score: number; // 0.0 to 1.0
  reason: string;
}

export interface CandidateFactors {
  blood: ABOCompatibilityResult;
  tissue: TissueCompatibilityResult;
  urgency: UrgencyResult;
  waitingTime: WaitingTimeResult;
}

export interface CandidateRanking {
  recipient: Recipient;
  eligible: boolean;
  score: number; // 0.0 to 100.0
  rank: number | null;
  factors: CandidateFactors;
  explanations: string[];
  exclusionReason?: string;
}

export interface MatchingEngineResult {
  organ: Organ;
  runTimestamp: string;
  algorithmVersion: string;
  weights: MatchingWeights;
  rankedCandidates: CandidateRanking[];
  excludedCandidates: CandidateRanking[];
  totalEvaluated: number;
}

// Database representations for runs, results, and reviews
export interface MatchingRunRecord {
  id: string;
  organ_id: string;
  executed_by: string;
  algorithm_version: string;
  configuration: MatchingWeights;
  candidate_count: number;
  eligible_count: number;
  generated_at: string;
  organ?: Organ;
}

export interface MatchingResultRecord {
  id: string;
  matching_run_id: string;
  recipient_id: string;
  eligible: boolean;
  score: number | null;
  factor_breakdown: CandidateFactors;
  exclusion_reason: string | null;
  rank: number | null;
  created_at: string;
  recipient?: Recipient;
}

export interface MatchingReviewRecord {
  id: string;
  matching_run_id: string;
  selected_recipient_id: string | null;
  reviewer_id: string;
  decision: "reviewed" | "selected_for_research_demo" | "not_selected_for_research_demo";
  notes: string | null;
  created_at: string;
}
