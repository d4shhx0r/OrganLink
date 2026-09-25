import { isABOCompatible } from "../lib/matching/abo-compatibility";
import { evaluateTissueCompatibility } from "../lib/matching/tissue-compatibility";
import { evaluateMedicalUrgency } from "../lib/matching/urgency";
import { evaluateWaitingTime } from "../lib/matching/waiting-time";
import { runMatchingEngine } from "../lib/matching/matching-engine";
import { DEFAULT_MATCHING_WEIGHTS, type MatchingWeights } from "../lib/matching/config";
import type { Organ, Recipient } from "../lib/types/organlink";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    console.log(`PASS: ${msg}`);
  }
}

async function runAllTests() {
  console.log("=================================================");
  console.log("ORGANLINK PHASE 3: MATCHING ENGINE TEST SUITE");
  console.log("=================================================\n");

  // ---------------------------------------------------------------------------
  // 1 & 2: ABO Compatibility Tests
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing ABO Blood Group Rules ---");
  const oToO = isABOCompatible("O+", "O+");
  assert(oToO.compatible && oToO.score === 1.0, "O+ to O+ is compatible with score 1.0");

  const oToA = isABOCompatible("O+", "A+");
  assert(oToA.compatible && oToA.score > 0.9, "O+ to A+ is compatible (universal donor transfer)");

  const aToB = isABOCompatible("A+", "B+");
  assert(!aToB.compatible && aToB.score === 0.0, "A+ to B+ is ABO incompatible");

  const abToO = isABOCompatible("AB+", "O+");
  assert(!abToO.compatible && abToO.score === 0.0, "AB+ to O+ is ABO incompatible");

  const bToAb = isABOCompatible("B+", "AB+");
  assert(bToAb.compatible && bToAb.score > 0.9, "B+ to AB+ is compatible");

  // ---------------------------------------------------------------------------
  // 3, 4, 5, 6: Tissue (HLA) Typing Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing HLA Tissue Compatibility ---");
  const exactTissue = evaluateTissueCompatibility(
    "HLA-A*02, HLA-B*07, HLA-DRB1*04",
    "HLA-A*02, HLA-B*07, HLA-DRB1*04"
  );
  assert(exactTissue.matchLevel === "exact" && exactTissue.score === 1.0, "Exact HLA match produces 1.0 score");

  const partialTissue = evaluateTissueCompatibility(
    "HLA-A*02, HLA-B*07, HLA-DRB1*04",
    "HLA-A*02, HLA-B*08, HLA-DRB1*03"
  );
  assert(partialTissue.matchLevel === "partial" && partialTissue.score >= 0.5, "Partial HLA match produces partial level and >0.5 score");

  const mismatchTissue = evaluateTissueCompatibility(
    "HLA-A*02, HLA-B*07, HLA-DRB1*04",
    "HLA-A*01, HLA-B*08, HLA-DRB1*03"
  );
  assert(mismatchTissue.matchLevel === "mismatch" && mismatchTissue.score === 0.05, "0 shared alleles produces mismatch and 0.05 score");

  const missingTissue = evaluateTissueCompatibility(
    "HLA-A*02",
    ""
  );
  assert(missingTissue.matchLevel === "insufficient_data" && missingTissue.score === 0.25, "Insufficient HLA data produces baseline 0.25 and flags research limitation");

  // ---------------------------------------------------------------------------
  // 7, 8, 9: Medical Urgency Weighting Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Medical Urgency Factors ---");
  const crit = evaluateMedicalUrgency("status_1_critical");
  assert(crit.score === 1.0, "Critical urgency maps to 1.0");

  const urg = evaluateMedicalUrgency("status_2_urgent");
  assert(urg.score === 0.7, "Urgent urgency maps to 0.70");

  const routine = evaluateMedicalUrgency("routine");
  assert(routine.score === 0.4, "Routine urgency maps to 0.40");

  // ---------------------------------------------------------------------------
  // 10: Waiting Time Calculation Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Testing Waiting Time Normalization ---");
  const refDate = new Date("2026-09-25T12:00:00Z");
  const wait100Days = new Date("2026-06-17T12:00:00Z").toISOString(); // 100 days prior
  const waitResult = evaluateWaitingTime(wait100Days, refDate);
  assert(waitResult.waitingDays === 100, `Waiting days calculated as ${waitResult.waitingDays} (expected 100)`);
  assert(waitResult.score > 0.1 && waitResult.score < 0.2, "100 days normalized score is proportional (~0.14)");

  // ---------------------------------------------------------------------------
  // 11, 12, 13, 14, 15: Matching Engine Execution & Determinism
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Testing Matching Engine & Deterministic Ranking ---");
  const sampleOrgan: Organ = {
    id: "11111111-1111-1111-1111-111111111111",
    organ_reference: "ORG-2026-5501",
    organ_type: "kidney",
    donor_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    blood_group: "O+",
    tissue_type: "HLA-A*02, HLA-B*07, HLA-DRB1*04",
    location: "Metro Transplant Facility",
    availability_status: "available",
    available_at: "2026-09-25T08:00:00Z",
    created_at: "2026-09-25T08:00:00Z",
    updated_at: "2026-09-25T08:00:00Z",
  };

  const sampleRecipients: Recipient[] = [
    {
      id: "rec-1",
      recipient_reference: "REC-2026-0001",
      full_name: "Alice Walker",
      date_of_birth: "1985-04-12",
      gender: "Female",
      blood_group: "O+",
      tissue_type: "HLA-A*02, HLA-B*07, HLA-DRB1*04", // exact match
      required_organ: "kidney",
      location: "Metro Hospital",
      medical_urgency: "status_1_critical",
      waiting_since: "2025-09-25T12:00:00Z", // 365 days
      status: "active",
      created_at: "2025-09-25T12:00:00Z",
      updated_at: "2025-09-25T12:00:00Z",
    },
    {
      id: "rec-2",
      recipient_reference: "REC-2026-0002",
      full_name: "Bob Davis",
      date_of_birth: "1978-11-20",
      gender: "Male",
      blood_group: "O+",
      tissue_type: "HLA-A*02, HLA-B*08, HLA-DRB1*03", // partial match
      required_organ: "kidney",
      location: "County Clinic",
      medical_urgency: "status_2_urgent",
      waiting_since: "2026-03-25T12:00:00Z", // ~184 days
      status: "active",
      created_at: "2026-03-25T12:00:00Z",
      updated_at: "2026-03-25T12:00:00Z",
    },
    {
      id: "rec-3",
      recipient_reference: "REC-2026-0003",
      full_name: "Charlie Brown",
      date_of_birth: "1990-01-15",
      gender: "Male",
      blood_group: "B+",
      tissue_type: "HLA-A*01, HLA-B*08, HLA-DRB1*03",
      required_organ: "liver", // ORGAN MISMATCH!
      location: "City General",
      medical_urgency: "status_1_critical",
      waiting_since: "2024-01-01T12:00:00Z",
      status: "active",
      created_at: "2024-01-01T12:00:00Z",
      updated_at: "2024-01-01T12:00:00Z",
    },
    {
      id: "rec-4",
      recipient_reference: "REC-2026-0004",
      full_name: "Diana Evans",
      date_of_birth: "1992-06-30",
      gender: "Female",
      blood_group: "O+",
      tissue_type: "HLA-A*02, HLA-B*07, HLA-DRB1*04",
      required_organ: "kidney",
      location: "City General",
      medical_urgency: "routine",
      waiting_since: "2026-08-01T12:00:00Z",
      status: "suspended", // STATUS NOT ACTIVE!
      created_at: "2026-08-01T12:00:00Z",
      updated_at: "2026-08-01T12:00:00Z",
    },
  ];

  const run1 = runMatchingEngine(sampleOrgan, sampleRecipients, DEFAULT_MATCHING_WEIGHTS, refDate);

  assert(run1.rankedCandidates.length === 2, "2 candidates ranked (Alice & Bob), 2 excluded (Charlie organ mismatch & Diana suspended)");
  assert(run1.excludedCandidates.length === 2, "2 candidates properly categorized as excluded");
  assert(run1.rankedCandidates[0].recipient.recipient_reference === "REC-2026-0001", "Alice is Rank #1 due to exact tissue match and critical urgency");
  assert(run1.rankedCandidates[0].rank === 1, "Rank #1 assigned integer 1");
  assert(run1.rankedCandidates[1].rank === 2, "Rank #2 assigned integer 2");
  assert(run1.rankedCandidates[0].score > run1.rankedCandidates[1].score, "Alice score higher than Bob score");

  // Determinism test: running again with same data produces identical scores & ranks
  const run2 = runMatchingEngine(sampleOrgan, sampleRecipients, DEFAULT_MATCHING_WEIGHTS, refDate);
  assert(
    run1.rankedCandidates[0].score === run2.rankedCandidates[0].score &&
    run1.rankedCandidates[0].rank === run2.rankedCandidates[0].rank,
    "Matching engine is 100% deterministic (repeated runs produce identical scores and ranks)"
  );

  // ---------------------------------------------------------------------------
  // 16: Weight Transparency Test (Requirement 35)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Testing Weight Transparency & Configurable Variations ---");
  const alternateWeights: MatchingWeights = {
    bloodCompatibility: 0.20,
    tissueCompatibility: 0.50, // Higher tissue weight
    urgency: 0.20,
    waitingTime: 0.10,
  };

  const runAlternate = runMatchingEngine(sampleOrgan, sampleRecipients, alternateWeights, refDate);
  assert(
    runAlternate.rankedCandidates[1].score !== run1.rankedCandidates[1].score,
    `Altering weights predictably changes candidate research score (Default Bob: ${run1.rankedCandidates[1].score}, Alternate Bob: ${runAlternate.rankedCandidates[1].score})`
  );

  // ---------------------------------------------------------------------------
  // 8: Regression: Tie-Breaking Order Tests (Urgency -> Waiting -> Reference)
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Testing Deterministic Multi-Tier Tie-Breaking ---");
  const tieOrgan: Organ = {
    ...sampleOrgan,
    blood_group: "O+",
    tissue_type: "HLA-A*02, HLA-B*07",
  };

  // Case A: Identical composite score & urgency, different waiting times
  const tieCandidate1: Recipient = {
    id: "tie-rec-1",
    recipient_reference: "REC-TIE-0001",
    full_name: "Tie Candidate One",
    date_of_birth: "1990-01-01",
    gender: "Other",
    blood_group: "O+",
    tissue_type: "HLA-A*02, HLA-B*07",
    required_organ: "kidney",
    location: "Center",
    medical_urgency: "status_2_urgent",
    waiting_since: "2025-01-01T00:00:00Z", // ~632 days (higher wait)
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const tieCandidate2: Recipient = {
    id: "tie-rec-2",
    recipient_reference: "REC-TIE-0002",
    full_name: "Tie Candidate Two",
    date_of_birth: "1991-01-01",
    gender: "Other",
    blood_group: "O+",
    tissue_type: "HLA-A*02, HLA-B*07",
    required_organ: "kidney",
    location: "Center",
    medical_urgency: "status_2_urgent",
    waiting_since: "2026-01-01T00:00:00Z", // ~267 days (lower wait)
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const tieRun = runMatchingEngine(tieOrgan, [tieCandidate2, tieCandidate1], DEFAULT_MATCHING_WEIGHTS, refDate);
  assert(tieRun.rankedCandidates[0].recipient.recipient_reference === "REC-TIE-0001", "Tie-breaking: Candidate with longer waiting time ranks first");

  // Case B: Identical score, urgency, and waiting time -> recipient reference ASC
  const tieCandidate3: Recipient = {
    ...tieCandidate1,
    id: "tie-rec-3",
    recipient_reference: "REC-TIE-AAAA", // Comes before REC-TIE-ZZZZ alphabetically
  };
  const tieCandidate4: Recipient = {
    ...tieCandidate1,
    id: "tie-rec-4",
    recipient_reference: "REC-TIE-ZZZZ",
  };
  const refTieRun = runMatchingEngine(tieOrgan, [tieCandidate4, tieCandidate3], DEFAULT_MATCHING_WEIGHTS, refDate);
  assert(refTieRun.rankedCandidates[0].recipient.recipient_reference === "REC-TIE-AAAA", "Tie-breaking: Alphanumeric recipient reference ASC resolves exact score ties deterministically");

  // ---------------------------------------------------------------------------
  // 9: Regression: Missing & Insufficient Data Handling
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Testing Missing / Incomplete Clinical Data Handling ---");
  const missingDataRecipient: Recipient = {
    ...sampleRecipients[0],
    id: "rec-missing",
    recipient_reference: "REC-MISSING-01",
    tissue_type: "", // Empty tissue type
  };
  const missingRun = runMatchingEngine(sampleOrgan, [missingDataRecipient], DEFAULT_MATCHING_WEIGHTS, refDate);
  assert(missingRun.rankedCandidates.length === 1, "Candidate with missing HLA data is still evaluated gracefully");
  assert(missingRun.rankedCandidates[0].factors.tissue.matchLevel === "insufficient_data", "HLA match level categorized as insufficient_data");
  assert(missingRun.rankedCandidates[0].factors.tissue.reason.includes("Research baseline"), "Explicit research notice included for insufficient data");

  // ---------------------------------------------------------------------------
  // 10: Regression: No Compatible Candidates Scenario
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Testing Zero Compatible Candidates Scenario ---");
  const incompatiblePool: Recipient[] = [
    { ...sampleRecipients[0], blood_group: "B+" }, // ABO mismatch with donor O+? Wait, O donor to B recipient is compatible, let's test AB donor to O recipient!
  ];
  const organAB: Organ = { ...sampleOrgan, blood_group: "AB+" };
  const poolO: Recipient[] = [
    { ...sampleRecipients[0], blood_group: "O+" }, // AB donor to O recipient is ABO incompatible
    { ...sampleRecipients[1], blood_group: "A-", required_organ: "heart" }, // Organ mismatch
  ];

  const zeroRun = runMatchingEngine(organAB, poolO, DEFAULT_MATCHING_WEIGHTS, refDate);
  assert(zeroRun.rankedCandidates.length === 0, "Zero eligible candidates correctly handled when no compatible candidates exist");
  assert(zeroRun.excludedCandidates.length === 2, "All incompatible candidates recorded in excludedCandidates");

  console.log("\n=================================================");
  console.log("ALL 26 MATCHING ENGINE REGRESSION TESTS PASSED");
  console.log("=================================================\n");
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
