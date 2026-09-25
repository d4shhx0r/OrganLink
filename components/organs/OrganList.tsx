"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight, Activity, Clock } from "lucide-react";
import type { Organ } from "@/lib/types/organlink";

interface OrganListProps {
  organs: Organ[];
  canCreate: boolean;
}

export function OrganList({ organs, canCreate }: OrganListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrgans = organs.filter((o) => {
    const matchesSearch =
      o.organ_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.organ_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || o.organ_type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || o.availability_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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
              placeholder="Search organ reference, type, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C00D9]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Organ Types</option>
            <option value="kidney">Kidney</option>
            <option value="liver">Liver</option>
            <option value="heart">Heart</option>
            <option value="lung">Lung</option>
            <option value="cornea">Cornea</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] focus:outline-none focus:border-[#7C00D9]"
          >
            <option value="all">All Availability States</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="allocated">Allocated</option>
            <option value="transplanted">Transplanted</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {canCreate && (
          <Link
            href="/app/organs/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Organ</span>
          </Link>
        )}
      </div>

      {/* Organs Table */}
      {filteredOrgans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <Activity className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#171717]">
            No organs currently registered
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {organs.length === 0
              ? "No organs currently recorded in the registry. Procured organs from approved donors can be registered here."
              : "No organs match the selected filter criteria."}
          </p>
          {canCreate && organs.length === 0 && (
            <Link
              href="/app/organs/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#7C00D9] text-white hover:bg-[#6c00bd]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Organ</span>
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
                  <th className="py-3.5 px-4">Organ Type</th>
                  <th className="py-3.5 px-4">Blood &amp; HLA</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Available Since</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#171717]">
                {filteredOrgans.map((organ) => (
                  <tr
                    key={organ.id}
                    className="hover:bg-[#FBFBFB] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#7C00D9]">
                      {organ.organ_reference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase text-[#171717]">
                      {organ.organ_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold">{organ.blood_group}</span>
                      <span className="text-[#6B7280] block text-[11px] truncate max-w-[120px]">
                        {organ.tissue_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {organ.location}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {new Date(organ.available_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          organ.availability_status === "available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : organ.availability_status === "reserved"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : organ.availability_status === "allocated"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {organ.availability_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/organs/${organ.id}`}
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
