"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HeartHandshake,
  Users,
  Activity,
  GitCompare,
  ShieldCheck,
  UserCheck,
  FlaskConical,
  X,
} from "lucide-react";
import type { AppRole } from "@/lib/types/organlink";

interface AppSidebarProps {
  role: AppRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ role, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  // Role-dependent navigation items
  const navItems = React.useMemo(() => {
    if (role === "donor") {
      return [
        { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
        { label: "My Donation", href: "/app/donors", icon: HeartHandshake },
        { label: "My Profile", href: "/app/profile", icon: UserCheck },
      ];
    }

    if (role === "recipient") {
      return [
        { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
        { label: "My Organ Request", href: "/app/recipients", icon: Users },
        { label: "My Profile", href: "/app/profile", icon: UserCheck },
      ];
    }

    // Admin & Hospital
    return [
      { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
      { label: "Donors", href: "/app/donors", icon: HeartHandshake },
      { label: "Recipients / Patients", href: "/app/recipients", icon: Users },
      { label: "Organs", href: "/app/organs", icon: Activity },
      { label: "Organ Matching", href: "/app/matching", icon: GitCompare },
      { label: "Audit Log", href: "/app/audit", icon: ShieldCheck },
      { label: "Profile", href: "/app/profile", icon: UserCheck },
    ];
  }, [role]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E7EB]">
      {/* Brand & Prototype Tag */}
      <div className="p-5 border-b border-[#F3F4F6] flex items-center justify-between">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="OrganLink"
            width={34}
            height={34}
            className="rounded-xl shadow-subtle shrink-0"
          />
          <div>
            <span className="font-semibold text-base text-[#171717] tracking-tight block">
              OrganLink
            </span>
            <span className="text-[11px] font-medium text-[#7C00D9] flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              Research Prototype
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="md:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F3F4F6]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
          {role === "admin"
            ? "Administration"
            : role === "hospital"
            ? "Clinical Center"
            : role === "donor"
            ? "Donor Portal"
            : "Recipient Portal"}
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                isActive
                  ? "bg-[#7C00D9]/10 text-[#7C00D9] font-semibold"
                  : "text-[#4B5563] hover:text-[#171717] hover:bg-[#F9FAFB]"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#7C00D9]" : "text-[#6B7280]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Role Badge & Attribution */}
      <div className="p-4 border-t border-[#F3F4F6] bg-[#FAFAFA] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Active Role</span>
          <span className="px-2 py-0.5 rounded-md font-medium capitalize bg-white border border-[#E5E7EB] text-[#171717]">
            {role}
          </span>
        </div>
        <div className="text-[11px] text-[#9CA3AF] text-center pt-1 border-t border-gray-100">
          Made by{" "}
          <a
            href="https://www.linkedin.com/in/debashishbordoloi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7C00D9] hover:underline font-medium"
          >
            Debashish
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
