"use client";

import React from "react";
import { Menu, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/app/app/dashboard/LogoutButton";
import type { AppRole } from "@/lib/types/organlink";

interface AppHeaderProps {
  userEmail: string;
  role: AppRole;
  onOpenMobileMenu: () => void;
}

export function AppHeader({
  userEmail,
  role,
  onOpenMobileMenu,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#E5E7EB]">
      {/* Research Boundary Banner */}
      <div className="bg-[#FAF5FF] border-b border-[#E9D5FF] px-4 py-1.5 text-center text-xs text-[#6B21A8] flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#7C00D9]" />
        <span>
          <strong>Research Prototype:</strong> Academic workflow implementation. Not certified for clinical decisions or production allocation.
        </span>
      </div>

      {/* Main Bar */}
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-[#4B5563] hover:text-[#171717] hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C00D9]/30"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-[#6B7280] hidden sm:inline-block">
            Organ Donation &amp; Transplantation Registry
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#171717]">
              {userEmail}
            </span>
            <span className="text-[11px] text-[#6B7280] capitalize">
              Role: <strong className="text-[#7C00D9]">{role}</strong>
            </span>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
