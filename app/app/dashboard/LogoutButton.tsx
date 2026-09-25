"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg text-[#4B5563] bg-[#F3F4F6] hover:bg-[#E5E7EB] hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C00D9]/30 transition-all disabled:opacity-50"
      aria-label="Log out of OrganLink"
    >
      {isLoggingOut ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
