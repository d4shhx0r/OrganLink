import type { MedicalUrgency } from "@/lib/types/organlink";
import type { UrgencyResult } from "./types";

/**
 * Maps recipient medical urgency into a research weighting factor.
 * 
 * IMPORTANT RESEARCH BOUNDARY:
 * This weighting represents a pre-assigned research category. The software
 * NEVER determines or adjusts clinical patient urgency automatically.
 */
export function evaluateMedicalUrgency(level: MedicalUrgency): UrgencyResult {
  switch (level) {
    case "status_1_critical":
      return {
        score: 1.0,
        level,
        reason: "Critical priority: Highest research urgency weighting (1.0).",
      };
    case "status_2_urgent":
      return {
        score: 0.70,
        level,
        reason: "Urgent priority: Intermediate research urgency weighting (0.70).",
      };
    case "routine":
    default:
      return {
        score: 0.40,
        level: "routine",
        reason: "Routine priority: Standard research baseline weighting (0.40).",
      };
  }
}
