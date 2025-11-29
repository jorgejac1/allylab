import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-primary text-black hover:bg-primary-dark hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]":
              variant === "primary",
            "bg-surface-tertiary text-text-primary border border-border hover:bg-surface hover:border-border-light":
              variant === "secondary",
            "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary":
              variant === "ghost",
            "bg-transparent text-primary border border-primary hover:bg-primary/10":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-7 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";