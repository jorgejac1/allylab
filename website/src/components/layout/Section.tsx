import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-24 px-6", className)}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ label, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      {label && (
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          {label}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">{title}</h2>
      {description && (
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">{description}</p>
      )}
    </div>
  );
}