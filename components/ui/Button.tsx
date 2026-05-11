"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-accent-primary text-bg-primary font-semibold",
    "hover:bg-accent-primary/90 hover:shadow-glow-teal",
    "focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  ].join(" "),
  secondary: [
    "bg-accent-secondary text-white font-semibold",
    "hover:bg-accent-secondary/90 hover:shadow-glow-indigo",
    "focus-visible:ring-2 focus-visible:ring-accent-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  ].join(" "),
  ghost: [
    "bg-transparent text-text-secondary",
    "hover:bg-white/5 hover:text-text-primary",
    "focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  ].join(" "),
  outline: [
    "bg-transparent text-text-primary border border-border",
    "hover:border-accent-primary/50 hover:text-accent-primary hover:shadow-glow-teal",
    "focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", href, className, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center font-body transition-all duration-150 outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize, ButtonProps };
