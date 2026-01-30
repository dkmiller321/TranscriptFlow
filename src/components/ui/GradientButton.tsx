"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-full disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "gradient-primary text-white hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg",
      outline: "border-2 border-forest-500/50 text-foreground hover:border-forest-500 hover:bg-forest-500/10 hover:shadow-glow",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export default GradientButton;
