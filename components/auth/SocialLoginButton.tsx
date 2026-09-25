"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

interface SocialLoginButtonProps {
  provider: "google";
  onNotice?: (msg: string) => void;
}

export function SocialLoginButton({
  provider,
  onNotice,
}: SocialLoginButtonProps) {
  const [showNotice, setShowNotice] = React.useState(false);

  const handleClick = () => {
    setShowNotice(true);
    if (onNotice) {
      onNotice("Google authentication is not configured yet. Please log in with your email.");
    }
    // Auto-dismiss the notice after 4 seconds
    setTimeout(() => {
      setShowNotice(false);
    }, 4000);
  };

  return (
    <div className="w-full relative">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        className="w-full h-12 flex items-center justify-center gap-3 bg-[#F1F3F3] hover:bg-[#E7E9E9] text-[#171717] font-medium text-[14.5px] border border-transparent transition-all"
        aria-label="Continue with Google (Feature currently disabled)"
      >
        {provider === "google" && (
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>Continue with Google</span>
        <span className="text-[11px] font-normal uppercase tracking-wider text-[#6B7280] bg-[#E2E5E5] px-1.5 py-0.5 rounded ml-auto">
          Soon
        </span>
      </Button>

      {showNotice && (
        <div
          role="status"
          className="absolute -bottom-10 left-0 right-0 text-center text-xs text-[#6B7280] bg-white py-1 px-2 rounded-md shadow-sm border border-[#E5E7EB] animate-in fade-in"
        >
          Google SSO is coming in an upcoming release.
        </div>
      )}
    </div>
  );
}
