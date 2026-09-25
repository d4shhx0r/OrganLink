import type { BloodGroup } from "@/lib/types/organlink";
import type { ABOCompatibilityResult } from "./types";

/**
 * Evaluates ABO and Rh compatibility between donor and candidate recipient.
 * 
 * NOTE: This is a software research compatibility model representing standard
 * immunohaematological rules. It does not replace crossmatch testing or comprehensive
 * clinical isohemagglutinin antibody titer evaluations.
 */
export function isABOCompatible(
  donorBlood: BloodGroup,
  recipientBlood: BloodGroup
): ABOCompatibilityResult {
  // Extract ABO antigen and Rh factor
  const parseBlood = (bg: BloodGroup) => {
    const rh = bg.endsWith("+") ? "+" : "-";
    const abo = bg.slice(0, bg.length - 1);
    return { abo, rh };
  };

  const donor = parseBlood(donorBlood);
  const recipient = parseBlood(recipientBlood);

  // Universal recipient: AB can receive from any ABO
  // Universal donor: O can donate to any ABO
  let aboCompatible = false;

  if (donor.abo === "O") {
    aboCompatible = true;
  } else if (donor.abo === "A") {
    aboCompatible = recipient.abo === "A" || recipient.abo === "AB";
  } else if (donor.abo === "B") {
    aboCompatible = recipient.abo === "B" || recipient.abo === "AB";
  } else if (donor.abo === "AB") {
    aboCompatible = recipient.abo === "AB";
  }

  if (!aboCompatible) {
    return {
      compatible: false,
      score: 0.0,
      reason: `ABO Incompatible: Donor ${donorBlood} cannot donate to recipient ${recipientBlood} due to major blood group mismatch.`,
    };
  }

  // Identical match is optimal (e.g. O+ to O+)
  const isIdentical = donorBlood === recipientBlood;
  const rhMismatch = donor.rh === "+" && recipient.rh === "-";

  if (isIdentical) {
    return {
      compatible: true,
      score: 1.0,
      reason: `Compatible: Identical ABO and Rh match (${donorBlood} \u2192 ${recipientBlood}).`,
    };
  }

  if (rhMismatch) {
    // Compatible ABO but Rh+ donor to Rh- recipient
    return {
      compatible: true,
      score: 0.90,
      reason: `Compatible ABO (${donor.abo} \u2192 ${recipient.abo}), with Rh difference (${donorBlood} \u2192 ${recipientBlood}).`,
    };
  }

  return {
    compatible: true,
    score: 0.95,
    reason: `Compatible: Universal or compatible ABO transfer (${donorBlood} \u2192 ${recipientBlood}).`,
  };
}
