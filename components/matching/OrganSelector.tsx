"use client";

import React from "react";
import type { Organ } from "@/lib/types/organlink";
import { Activity, Clock, MapPin, Dna } from "lucide-react";

interface OrganSelectorProps {
  availableOrgans: Organ[];
  selectedOrganId: string;
  onSelectOrgan: (id: string) => void;
}

export function OrganSelector({
  availableOrgans,
  selectedOrganId,
  onSelectOrgan,
}: OrganSelectorProps) {
  const selectedOrgan = availableOrgans.find((o) => o.id === selectedOrganId);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717] tracking-tight">
            1. Select Available Organ for Matching
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Only procured organs from approved donors in &quot;available&quot; state are eligible for candidate matching.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedOrganId}
            onChange={(e) => onSelectOrgan(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-[#F1F3F3] text-xs font-medium text-[#171717] border border-transparent focus:border-[#7C00D9] focus:bg-white focus:outline-none transition-colors"
          >
            <option value="" disabled>
              -- Select Procured Organ --
            </option>
            {availableOrgans.map((organ) => (
              <option key={organ.id} value={organ.id}>
                {organ.organ_reference} &bull; {organ.organ_type.toUpperCase()} ({organ.blood_group})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedOrgan ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] text-xs animate-in fade-in">
          <div>
            <span className="text-[#6B7280] block mb-1">Organ &amp; Reference</span>
            <div className="flex items-center gap-1.5 font-semibold text-[#171717]">
              <Activity className="w-3.5 h-3.5 text-[#7C00D9]" />
              <span className="capitalize">{selectedOrgan.organ_type}</span>
              <span className="text-[11px] font-mono text-[#7C00D9]">
                ({selectedOrgan.organ_reference})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">ABO Blood Group</span>
            <span className="font-semibold text-sm text-[#171717]">
              {selectedOrgan.blood_group}
            </span>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Tissue Typing (HLA)</span>
            <div className="flex items-center gap-1 text-[#171717] font-mono">
              <Dna className="w-3 h-3 text-[#6B7280] shrink-0" />
              <span className="truncate" title={selectedOrgan.tissue_type}>
                {selectedOrgan.tissue_type}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#6B7280] block mb-1">Preservation Center</span>
            <div className="flex items-center gap-1 text-[#171717]">
              <MapPin className="w-3 h-3 text-[#6B7280] shrink-0" />
              <span className="truncate" title={selectedOrgan.location}>
                {selectedOrgan.location}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-[#9CA3AF]">
          Select an available organ above to view clinical specifications and initiate candidate ranking.
        </div>
      )}
    </div>
  );
}
