import { MAX_WAITING_DAYS_BENCHMARK } from "./config";
import type { WaitingTimeResult } from "./types";

/**
 * Calculates waiting duration in days from the recipient's `waiting_since` timestamp
 * and computes a normalized 0.0–1.0 research weighting score.
 * 
 * Uses UTC internally without modifying stored timestamps.
 */
export function evaluateWaitingTime(
  waitingSinceIso: string,
  referenceDateUtc: Date = new Date()
): WaitingTimeResult {
  const waitingDate = new Date(waitingSinceIso);
  const diffMs = Math.max(0, referenceDateUtc.getTime() - waitingDate.getTime());
  const waitingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Normalized score: scales linearly up to MAX_WAITING_DAYS_BENCHMARK (e.g. 730 days)
  const normalizedScore = Number(
    Math.min(1.0, Math.max(0.05, waitingDays / MAX_WAITING_DAYS_BENCHMARK)).toFixed(2)
  );

  return {
    waitingDays,
    score: normalizedScore,
    reason: `Accumulated ${waitingDays} day(s) on the active waiting list (normalized factor: ${normalizedScore}).`,
  };
}
