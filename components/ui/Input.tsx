import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        disabled={disabled}
        className={`w-full h-12 px-4 rounded-xl bg-[#F1F3F3] text-[#171717] text-[14.5px] placeholder:text-[#9CA3AF] border transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 bg-[#FEF2F2]/40"
            : "border-transparent hover:border-[#E0E2E2] focus:border-[#7C00D9] focus:bg-white focus:ring-2 focus:ring-[#7C00D9]/15"
        } ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
