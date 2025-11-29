import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "blue" | "purple" | "orange" | "red";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded",
        {
          "bg-surface-tertiary text-text-secondary": variant === "default",
          "bg-primary/20 text-primary": variant === "green",
          "bg-accent-blue/20 text-accent-blue": variant === "blue",
          "bg-accent-purple/20 text-accent-purple": variant === "purple",
          "bg-accent-orange/20 text-accent-orange": variant === "orange",
          "bg-accent-red/20 text-accent-red": variant === "red",
        },
        className
      )}
    >
      {children}
    </span>
  );
}