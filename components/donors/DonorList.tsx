"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, ArrowRight, HeartHandshake } from "lucide-react";
import type { Donor, BloodGroup, DonorApprovalStatus } from "@/lib/types/organlink";

interface DonorListProps {
  donors: Donor[];
  canCreate: boolean;
}

export function DonorList({ donors, canCreate }: DonorListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bloodFilter, setBloodFilter] = useState<string>("all");

  const filteredDonors = donors.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donor_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || d.approval_status === statusFilter;

    const matchesBlood =
      bloodFilter === "all" || d.blood_group === bloodFilter;

    return matchesSearch && matchesStatus && matchesBlood;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search donor name, reference, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C00D9] focus:ring-2 focus:ring-[#7C00D9]/15"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Blood Group Filter */}
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Blood Groups</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        {canCreate && (
          <Link
            href="/app/donors/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Donor</span>
          </Link>
        )}
      </div>

      {/* Donor Table / Responsive Container */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <HeartHandshake className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#171717]">
            No donors found
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {donors.length === 0
              ? "No donors currently registered in the system. Register the first donor to begin building the registry."
              : "No donor records matched your search and filter criteria."}
          </p>
          {canCreate && donors.length === 0 && (
            <Link
              href="/app/donors/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Donor</span>
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
                  <th className="py-3.5 px-4">Donor Name</th>
                  <th className="py-3.5 px-4">Blood &amp; HLA</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Consent</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {filteredDonors.map((donor) => (
                  <tr
                    key={donor.id}
                    className="hover:bg-[#FBFBFB] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#7C00D9]">
                      {donor.donor_reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {donor.full_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold">{donor.blood_group}</span>
                      <span className="text-[#6B7280] block text-[11px]">
                        {donor.tissue_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {donor.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-[#4B5563]">
                        {donor.consent_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          donor.approval_status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : donor.approval_status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {donor.approval_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/donors/${donor.id}`}
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
