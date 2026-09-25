/**
 * OrganLink Phase 4: Cryptographically-Linked Append-Only Audit Log Tests
 * 
 * Verifies:
 * 1. Valid chain verification (Genesis to N blocks)
 * 2. Modified record detection (tampered hash)
 * 3. Broken previous_hash detection (disrupted pointer linkage)
 * 4. Changed state detection (previous_state or new_state mutation)
 * 5. Changed action detection (altered event type)
 * 6. Changed timestamp detection (retroactive date modification)
 */

import { computeAuditHash, verifyRecordsIntegrity, type AuditRecord } from "../lib/audit/audit-service";

function createMockChain(length = 5): AuditRecord[] {
  const records: AuditRecord[] = [];
  let prevHash: string | null = null;
  const baseTime = 1710000000000;

  for (let i = 0; i < length; i++) {
    const timestamp = new Date(baseTime + i * 60000).toISOString();
    const action = i === 0 ? "DONOR_CREATED" : i === 1 ? "DONOR_APPROVED" : "ORGAN_REGISTERED";
    const entityType = i === 2 ? "organ" : "donor";
    const entityId = `entity-uuid-${i + 1}`;
    const previousState = i === 0 ? null : { status: "pending" };
    const newState = { status: "approved", step: i + 1 };
    const metadata = { note: `Event ${i + 1}` };

    const currentHash = computeAuditHash(prevHash, {
      action,
      entityType,
      entityId,
      previousState,
      newState,
      metadata,
      timestamp,
    });

    const record: AuditRecord = {
      id: `record-uuid-${i + 1}`,
      actor_user_id: `user-uuid-${i + 1}`,
      actor_role: "hospital",
      action,
      entity_type: entityType,
      entity_id: entityId,
      previous_state: previousState,
      new_state: newState,
      metadata,
      previous_hash: prevHash,
      current_hash: currentHash,
      created_at: timestamp,
    };

    records.push(record);
    prevHash = currentHash;
  }

  return records;
}

function runTests() {
  console.log("============================================================");
  console.log("OrganLink: SHA-256 Hash-Chained Audit Trail Integrity Tests");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✘ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 1. Valid Chain Verification
  {
    const validChain = createMockChain(5);
    const result = verifyRecordsIntegrity(validChain);
    assert(result.isValid === true, "1. Valid chain verifies correctly", result.details);
    assert(result.totalRecords === 5, "1b. Correct total count in valid chain");
  }

  // 1c. Empty chain (Genesis state)
  {
    const result = verifyRecordsIntegrity([]);
    assert(result.isValid === true && result.totalRecords === 0, "1c. Empty chain represents valid Genesis state");
  }

  // 2. Modified Record Detection (tampered current_hash)
  {
    const tampered = createMockChain(5);
    tampered[2].current_hash = "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";
    const result = verifyRecordsIntegrity(tampered);
    assert(result.isValid === false, "2. Modified record (current_hash) is detected as invalid");
    assert(result.brokenIndex === 2, "2b. Tampering detected at exact index 2");
    assert(result.tamperType === "content", "2c. Tamper type identified as content");
  }

  // 3. Broken previous_hash detection
  {
    const brokenLinkage = createMockChain(5);
    // Sever the link at index 3
    brokenLinkage[3].previous_hash = "0000000000000000000000000000000000000000000000000000000000000000";
    const result = verifyRecordsIntegrity(brokenLinkage);
    assert(result.isValid === false, "3. Broken previous_hash linkage is detected as invalid");
    assert(result.brokenIndex === 3, "3b. Linkage failure detected at exact index 3");
    assert(result.tamperType === "linkage", "3c. Tamper type identified as linkage");
  }

  // 4. Changed State Detection
  {
    const stateMutated = createMockChain(5);
    // Maliciously tamper with new_state without updating hash
    stateMutated[1].new_state = { status: "escalated_privilege", unauthorized: true };
    const result = verifyRecordsIntegrity(stateMutated);
    assert(result.isValid === false, "4. Unauthorized state change is detected");
    assert(result.brokenIndex === 1, "4b. State tampering detected at exact index 1");
    assert(result.tamperType === "content", "4c. Identified as content tampering");
  }

  // 5. Changed Action Detection
  {
    const actionMutated = createMockChain(5);
    // Maliciously change action from DONOR_APPROVED to DONOR_REJECTED
    actionMutated[1].action = "DONOR_REJECTED";
    const result = verifyRecordsIntegrity(actionMutated);
    assert(result.isValid === false, "5. Unauthorized action tampering is detected");
    assert(result.brokenIndex === 1, "5b. Action tampering detected at exact index 1");
    assert(result.tamperType === "content", "5c. Identified as content tampering");
  }

  // 6. Changed Timestamp Detection
  {
    const timestampMutated = createMockChain(5);
    // Backdate a record
    timestampMutated[2].created_at = new Date("2020-01-01T00:00:00Z").toISOString();
    const result = verifyRecordsIntegrity(timestampMutated);
    assert(result.isValid === false, "6. Timestamp tampering / backdating is detected");
    assert(result.brokenIndex === 2, "6b. Timestamp tampering detected at exact index 2");
    assert(result.tamperType === "content", "6c. Identified as content tampering");
  }

  console.log("\n============================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
