import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "default",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C00D9]/30 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none text-[14.5px]";

    const sizeStyles = {
      default: "h-12 px-5 rounded-xl w-full",
      sm: "h-9 px-3 text-xs rounded-lg",
      lg: "h-14 px-6 text-base rounded-xl w-full",
    };

    const variantStyles = {
      primary:
        "bg-[#7C00D9] text-white hover:bg-[#6c00bd] active:bg-[#5c00a1] shadow-sm",
      secondary:
        "bg-[#F1F3F3] text-[#171717] hover:bg-[#E7E9E9] active:bg-[#DFE1E1] border border-transparent",
      outline:
        "bg-transparent text-[#171717] border border-[#E5E7EB] hover:bg-[#F9FAFB] active:bg-[#F3F4F6]",
      ghost:
        "bg-transparent text-[#6B7280] hover:text-[#171717] hover:bg-[#F9FAFB] active:bg-[#F3F4F6]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
