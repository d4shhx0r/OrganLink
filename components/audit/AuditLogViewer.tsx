"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, RefreshCw, KeyRound } from "lucide-react";
import type { AuditRecord } from "@/lib/audit/audit-service";

interface AuditLogViewerProps {
  initialRecords: AuditRecord[];
  integrityStatus: {
    isValid: boolean;
    totalRecords: number;
    details?: string;
  };
}

export function AuditLogViewer({
  initialRecords,
  integrityStatus,
}: AuditLogViewerProps) {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  return (
    <div className="space-y-6">
      {/* Cryptographic Integrity Status Card */}
      <div
        className={`p-6 rounded-2xl border ${
          integrityStatus.isValid
            ? "bg-white border-[#E5E7EB]"
            : "bg-red-50 border-red-200"
        } shadow-subtle`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {integrityStatus.isValid ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#171717]">
                  {integrityStatus.isValid
                    ? "Cryptographic Audit Chain Intact"
                    : "Cryptographic Tampering Detected"}
                </h2>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    integrityStatus.isValid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {integrityStatus.isValid ? "Verified" : "Verification Failed"}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
                {integrityStatus.details}. Each audit block embeds the SHA-256 hash of its predecessor, creating a tamper-evident audit ledger without blockchain overhead.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-[#6B7280] block">Chain Length</span>
            <span className="text-lg font-semibold text-[#171717]">
              {integrityStatus.totalRecords} blocks
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {initialRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <KeyRound className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#171717]">
            Audit ledger is in Genesis state
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            No audit records created yet. All donor registrations, clinical reviews, and organ state transitions will automatically append verified blocks here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Actor Role</th>
                  <th className="py-3.5 px-4">Block Hash (SHA-256)</th>
                  <th className="py-3.5 px-4">Chain Link</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {initialRecords.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#FBFBFB] transition-colors cursor-pointer"
                    onClick={() => setSelectedRecord(log)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#6B7280]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#7C00D9]">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-medium uppercase text-[11px] text-[#4B5563]">
                      {log.entity_type}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      {log.actor_role || "system"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#4B5563]">
                      <span title={log.current_hash}>
                        {log.current_hash.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.previous_hash ? (
                        <span
                          className="font-mono text-[10px] text-[#9CA3AF]"
                          title={log.previous_hash}
                        >
                          &larr; {log.previous_hash.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          GENESIS
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(log);
                        }}
                        className="text-[#7C00D9] hover:underline font-medium text-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Inspector for selected audit record */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-[#E5E7EB] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-[#7C00D9]">
                  {selectedRecord.action}
                </span>
                <h3 className="text-sm font-semibold text-[#171717]">
                  Audit Block Inspection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-xs font-medium text-[#6B7280] hover:text-[#171717] px-2 py-1 rounded-lg hover:bg-[#F3F4F6]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#6B7280] block mb-0.5">Timestamp:</span>
                <span className="text-[#171717] font-mono">
                  {new Date(selectedRecord.created_at).toISOString()}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] block mb-0.5">SHA-256 Current Hash:</span>
                <span className="text-[#171717] font-mono break-all bg-[#F9FAFB] p-2 rounded block">
                  {selectedRecord.current_hash}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] block mb-0.5">Previous Block Hash:</span>
                <span className="text-[#171717] font-mono break-all bg-[#F9FAFB] p-2 rounded block">
                  {selectedRecord.previous_hash || "NULL (Genesis Block)"}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] block mb-0.5">Target Entity ID:</span>
                <span className="text-[#171717] font-mono">
                  {selectedRecord.entity_type} / {selectedRecord.entity_id}
                </span>
              </div>

              {selectedRecord.metadata && (
                <div>
                  <span className="text-[#6B7280] block mb-0.5">Metadata (Safe):</span>
                  <pre className="bg-[#F1F3F3] p-2 rounded text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedRecord.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
