"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  onBack: () => void;
  appName?: string;
}

export function LoginForm({ onBack, appName = "OrganLink" }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/app/dashboard";

  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Map internal errors to safe, user-friendly messages
        if (
          error.message?.toLowerCase().includes("invalid login credentials") ||
          error.message?.toLowerCase().includes("invalid credentials") ||
          error.status === 400
        ) {
          setAuthError("Invalid email or password. Please try again.");
        } else if (
          error.message?.toLowerCase().includes("email not confirmed")
        ) {
          setAuthError("Please confirm your email address before logging in.");
        } else if (error.message?.toLowerCase().includes("rate limit")) {
          setAuthError("Too many login attempts. Please wait a moment and try again.");
        } else if (
          error.message?.toLowerCase().includes("network") ||
          error.message?.toLowerCase().includes("fetch failed") ||
          error.name === "AuthRetryableFetchError"
        ) {
          setAuthError("Network connection issue. Please check your connection and try again.");
        } else {
          setAuthError("Something went wrong. Please check your credentials and try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success: redirect to destination
      router.push(redirectTo);
      router.refresh();
    } catch {
      setAuthError("An unexpected error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

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
      <h1 className="text-[21px] font-semibold text-[#171717] tracking-tight text-center mb-1.5">
        Enter your credentials
      </h1>
      <p className="text-[13.5px] text-[#6B7280] text-center mb-6">
        Sign in to access your secure hospital &amp; donor portal
      </p>

      {/* Clean Inline Error Banner */}
      {authError && (
        <div
          role="alert"
          aria-live="polite"
          className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center gap-2.5 text-[13px] text-[#DC2626] animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{authError}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-3.5"
        noValidate
      >
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          disabled={isLoading}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={isLoading}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="pt-1.5">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="h-12 w-full text-[14.5px] font-medium"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </div>
      </form>

      {/* Back to Login Action */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#6B7280] hover:text-[#171717] transition-colors py-1 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C00D9]/30 disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </button>
      </div>
    </div>
  );
}
