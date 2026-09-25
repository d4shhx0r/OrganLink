/**
 * OrganLink Research Matching Engine Configuration
 * 
 * IMPORTANT RESEARCH NOTE:
 * The academic paper ("An Implementation Perspective of Blockchain Technology in Leveraging
 * Organ Donation in a Transparent Mode to both Patients and Donors") highlights blood group,
 * tissue typing, medical urgency, and waiting time as core matching criteria, but does NOT provide
 * a validated numerical weighting formula.
 * 
 * OrganLink defines this transparent, configurable research model to evaluate candidates.
 * It is NOT a clinical allocation system or medical decision-making algorithm.
 */

export const ALGORITHM_VERSION = "organlink-research-v1";

export interface MatchingWeights {
  bloodCompatibility: number;
  tissueCompatibility: number;
  urgency: number;
  waitingTime: number;
}

/**
 * Central Configurable Weights (Must sum to 1.0)
 * Allows academic tuning and reproducible comparison across algorithm versions.
 */
export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  bloodCompatibility: 0.40,
  tissueCompatibility: 0.30,
  urgency: 0.20,
  waitingTime: 0.10,
};

/**
 * Waiting time normalization benchmark (in days).
 * 730 days (~2 years) represents the upper scaling boundary for maximum waiting contribution.
 */
export const MAX_WAITING_DAYS_BENCHMARK = 730;
