import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-2xl p-6 transition-all duration-300",
        hover && "hover:border-border-light hover:-translate-y-1 hover:glow",
        className
      )}
    >
      {children}
    </div>
  );
}