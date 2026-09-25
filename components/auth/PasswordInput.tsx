"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/Input";

export interface PasswordInputProps extends InputProps {
  label?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ label, error, id, className = "", ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full text-left space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-[#4B5563]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={inputId}
          ref={ref}
          type={showPassword ? "text" : "password"}
          hasError={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`pr-12 ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={0}
          onClick={toggleVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#E5E7EB]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C00D9]/30 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 transition-transform duration-150" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 transition-transform duration-150" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[12.5px] text-[#DC2626] font-normal leading-tight pt-0.5 animate-in fade-in"
        >
          {error}
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
