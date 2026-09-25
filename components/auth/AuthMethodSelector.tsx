"use client";

import React from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SocialLoginButton } from "./SocialLoginButton";

interface AuthMethodSelectorProps {
  onSelectEmail: () => void;
  appName?: string;
}

export function AuthMethodSelector({
  onSelectEmail,
  appName = "OrganLink",
}: AuthMethodSelectorProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Brand Mark */}
      <div className="mb-6 flex justify-center">
        <Image
          src="/logo.svg"
          alt={`${appName} Logo`}
          width={44}
          height={44}
          className="rounded-xl shadow-subtle"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-[21px] font-semibold text-[#171717] tracking-tight text-center mb-7">
        Log in to {appName}
      </h1>

      {/* Actions */}
      <div className="w-full space-y-3">
        <Button
          type="button"
          onClick={onSelectEmail}
          variant="primary"
          className="h-12 w-full flex items-center justify-center gap-2.5 text-[14.5px] font-medium"
        >
          <Mail className="w-4 h-4 text-white/90" />
          <span>Continue with email</span>
        </Button>

        <SocialLoginButton provider="google" />
      </div>

      {/* Subtext */}
      <p className="mt-8 text-center text-xs text-[#6B7280] leading-relaxed max-w-[320px]">
        By continuing, you agree to OrganLink&apos;s healthcare data protocols
        and security compliance standards.
      </p>
    </div>
  );
}
