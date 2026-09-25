"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight, Users, AlertTriangle } from "lucide-react";
import type { Recipient, OrganType, MedicalUrgency } from "@/lib/types/organlink";

interface RecipientListProps {
  recipients: Recipient[];
  canCreate: boolean;
}

export function RecipientList({ recipients, canCreate }: RecipientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [organFilter, setOrganFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipient_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrgan =
      organFilter === "all" || r.required_organ === organFilter;

    const matchesUrgency =
      urgencyFilter === "all" || r.medical_urgency === urgencyFilter;

    return matchesSearch && matchesOrgan && matchesUrgency;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search patient name, reference, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C00D9]"
            />
          </div>

          <select
            value={organFilter}
            onChange={(e) => setOrganFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Organs</option>
            <option value="kidney">Kidney</option>
            <option value="liver">Liver</option>
            <option value="heart">Heart</option>
            <option value="lung">Lung</option>
            <option value="cornea">Cornea</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Urgency Levels</option>
            <option value="status_1_critical">Status 1 (Critical)</option>
            <option value="status_2_urgent">Status 2 (Urgent)</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        {canCreate && (
          <Link
            href="/app/recipients/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Patient</span>
          </Link>
        )}
      </div>

      {/* Table */}
      {filteredRecipients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <Users className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#171717]">
            No recipients found
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {recipients.length === 0
              ? "No recipient records yet. Add a patient to the waiting list to prepare for matching."
              : "No recipients match the selected criteria."}
          </p>
          {canCreate && recipients.length === 0 && (
            <Link
              href="/app/recipients/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Patient</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Required Organ</th>
                  <th className="py-3.5 px-4">Blood &amp; HLA</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Waiting Since</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {filteredRecipients.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-[#FBFBFB] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#7C00D9]">
                      {rec.recipient_reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {rec.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase text-[#7C00D9]">
                      {rec.required_organ}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold">{rec.blood_group}</span>
                      <span className="text-[#6B7280] block text-[11px] truncate max-w-[120px]">
                        {rec.tissue_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          rec.medical_urgency === "status_1_critical"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : rec.medical_urgency === "status_2_urgent"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {rec.medical_urgency.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {new Date(rec.waiting_since).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium">
                      {rec.status}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/recipients/${rec.id}`}
                        className="inline-flex items-center gap-1 text-[#7C00D9] hover:underline font-medium"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
