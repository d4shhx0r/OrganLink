import type { TissueCompatibilityResult, TissueMatchLevel } from "./types";

/**
 * Evaluates HLA tissue typing compatibility between donor and recipient.
 * 
 * IMPORTANT RESEARCH LIMITATION:
 * Real clinical HLA crossmatching requires high-resolution serological typing,
 * panel reactive antibody (PRA) testing, and virtual crossmatching for donor-specific
 * antibodies (DSA). This module provides a transparent research-grade string comparison
 * of documented loci (e.g. HLA-A, HLA-B, HLA-DRB1) and explicitly flags insufficient data.
 */
export function evaluateTissueCompatibility(
  donorTissue: string | null | undefined,
  recipientTissue: string | null | undefined
): TissueCompatibilityResult {
  const normalizeLoci = (str: string | null | undefined): string[] => {
    if (!str || !str.trim()) return [];
    return str
      .split(/[,;\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 2);
  };

  const donorLoci = normalizeLoci(donorTissue);
  const recipientLoci = normalizeLoci(recipientTissue);

  // If either has insufficient structured allele data
  if (donorLoci.length < 2 || recipientLoci.length < 2) {
    return {
      score: 0.25,
      matchLevel: "insufficient_data",
      sharedLoci: [],
      totalLociChecked: Math.max(donorLoci.length, recipientLoci.length),
      reason: "Insufficient structured tissue data for research comparison. Research baseline score (0.25) applied.",
    };
  }

  // Calculate intersection of alleles
  const shared = donorLoci.filter((locus) => recipientLoci.includes(locus));
  const totalChecked = Math.max(donorLoci.length, recipientLoci.length);

  // Exact match
  if (shared.length === donorLoci.length && shared.length === recipientLoci.length) {
    return {
      score: 1.0,
      matchLevel: "exact",
      sharedLoci: shared,
      totalLociChecked: totalChecked,
      reason: `Exact match: 100% concordance on ${shared.length} recorded HLA loci (${shared.join(", ")}).`,
    };
  }

  // Partial match
  if (shared.length > 0) {
    // Proportional score: baseline 0.30 + up to 0.70 based on fraction of matching alleles
    const matchFraction = shared.length / totalChecked;
    const score = Number((0.30 + 0.70 * matchFraction).toFixed(2));

    return {
      score,
      matchLevel: "partial",
      sharedLoci: shared,
      totalLociChecked: totalChecked,
      reason: `Partial match: ${shared.length} of ${totalChecked} recorded loci concordant (${shared.join(", ")}).`,
    };
  }

  // Mismatch
  return {
    score: 0.05,
    matchLevel: "mismatch",
    sharedLoci: [],
    totalLociChecked: totalChecked,
    reason: `Tissue mismatch: 0 matching loci found between donor (${donorLoci.join(", ")}) and recipient (${recipientLoci.join(", ")}).`,
  };
}
