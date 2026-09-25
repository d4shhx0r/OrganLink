"use client";

import React, { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import type { AppRole } from "@/lib/types/organlink";

interface AppShellProps {
  userEmail: string;
  role: AppRole;
  children: React.ReactNode;
}

export function AppShell({ userEmail, role, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex">
      {/* Sidebar */}
      <AppSidebar
        role={role}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          userEmail={userEmail}
          role={role}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <footer className="py-4 border-t border-[#F3F4F6] text-center text-xs text-[#9CA3AF]">
          <span>OrganLink • </span>
          <span>Made by </span>
          <a
            href="https://www.linkedin.com/in/debashishbordoloi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7C00D9] hover:underline font-medium"
          >
            Debashish
          </a>
        </footer>
      </div>
    </div>
  );
}
