import * as React from "react";
import { Input, type InputProps } from "@/components/ui/Input";

export interface AuthInputProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

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
            hasError={!!error}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={className}
            {...props}
          />
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-[12.5px] text-[#DC2626] font-normal leading-tight pt-0.5 animate-in fade-in"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[12.5px] text-[#6B7280]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
