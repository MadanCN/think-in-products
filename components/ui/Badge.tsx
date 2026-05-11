import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "solid";
type BadgeSize = "sm" | "md";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bg-secondary border border-border text-text-muted",
  outline: "bg-transparent border text-text-secondary",
  solid: "bg-accent-primary/15 border border-accent-primary/30 text-accent-primary",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2.5 py-1 text-xs",
};

function Badge({ variant = "default", size = "md", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeVariant, BadgeSize, BadgeProps };
