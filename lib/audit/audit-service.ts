import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

export interface AuditEventParams {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: "donor" | "recipient" | "organ" | "profile" | "auth" | "system";
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditRecord {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  previous_hash: string | null;
  current_hash: string;
  created_at: string;
}

/**
 * Computes deterministic SHA-256 cryptographic hash of audit event payload.
 * Provides cryptographic tamper-evidence (chaining previous hash to current block).
 * Note: This provides cryptographic integrity verification, NOT decentralized consensus.
 */
export function computeAuditHash(
  previousHash: string | null,
  data: {
    action: string;
    entityType: string;
    entityId: string;
    previousState?: unknown;
    newState?: unknown;
    metadata?: unknown;
    timestamp: string;
  }
): string {
  const content = JSON.stringify({
    previousHash: previousHash || "GENESIS_BLOCK_ORGANLINK",
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    previousState: data.previousState ?? null,
    newState: data.newState ?? null,
    metadata: data.metadata ?? null,
    timestamp: data.timestamp,
  });

  return createHash("sha256").update(content).digest("hex");
}

/**
 * Appends a tamper-evident audit record to the cryptographic audit chain.
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<AuditRecord | null> {
  try {
    const supabase = await createClient();

    // 1. Fetch latest audit entry to link the hash chain
    const { data: latestRecords } = await supabase
      .from("audit_logs")
      .select("current_hash")
      .order("created_at", { ascending: false })
      .limit(1);

    const previousHash = latestRecords && latestRecords.length > 0 
      ? latestRecords[0].current_hash 
      : null;

    const timestamp = new Date().toISOString();
    const currentHash = computeAuditHash(previousHash, {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousState: params.previousState,
      newState: params.newState,
      metadata: params.metadata,
      timestamp,
    });

    const newRecord = {
      actor_user_id: params.actorUserId || null,
      actor_role: params.actorRole || "system",
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      previous_state: params.previousState || null,
      new_state: params.newState || null,
      metadata: params.metadata || null,
      previous_hash: previousHash,
      current_hash: currentHash,
      created_at: timestamp,
    };

    const { data, error } = await supabase
      .from("audit_logs")
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error("[Audit Service] Failed to insert audit log:", error.message);
      return null;
    }

    return data as AuditRecord;
  } catch (err) {
    console.error("[Audit Service] Unexpected error in recordAuditEvent:", err);
    return null;
  }
}

/**
 * Verifies sequential cryptographic integrity of the entire audit chain.
 */
export async function verifyAuditChainIntegrity(): Promise<{
  isValid: boolean;
  totalRecords: number;
  brokenIndex?: number;
  details?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: records, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !records) {
      return { isValid: false, totalRecords: 0, details: error?.message || "Could not retrieve logs" };
    }

    if (records.length === 0) {
      return { isValid: true, totalRecords: 0, details: "Audit trail is empty (Genesis state)" };
    }

    let expectedPrevHash: string | null = null;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      // Check linkage
      if (rec.previous_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: records.length,
          brokenIndex: i,
          details: `Chain link broken at index ${i}: expected previous_hash ${expectedPrevHash}, found ${rec.previous_hash}`,
        };
      }

      // Recompute hash
      const recalculated = computeAuditHash(rec.previous_hash, {
        action: rec.action,
        entityType: rec.entity_type,
        entityId: rec.entity_id,
        previousState: rec.previous_state,
        newState: rec.new_state,
        metadata: rec.metadata,
        timestamp: rec.created_at,
      });

      if (recalculated !== rec.current_hash) {
        return {
          isValid: false,
          totalRecords: records.length,
          brokenIndex: i,
          details: `Content tampering detected at index ${i} (ID: ${rec.id})`,
        };
      }

      expectedPrevHash = rec.current_hash;
    }

    return { isValid: true, totalRecords: records.length, details: "All cryptographic block hashes verified" };
  } catch (err) {
    return { isValid: false, totalRecords: 0, details: String(err) };
  }
}
