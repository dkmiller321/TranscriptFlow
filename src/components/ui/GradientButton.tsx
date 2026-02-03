"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, glow = true, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      "relative inline-flex items-center justify-center gap-2",
      "font-semibold rounded-full",
      "transition-all duration-300 ease-out",
      "disabled:opacity-50 disabled:pointer-events-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    );

    const variants = {
      primary: cn(
        "text-primary-foreground",
        "bg-gradient-to-r from-[hsl(152,60%,45%)] via-[hsl(160,65%,43%)] to-[hsl(168,60%,42%)]",
        "hover:from-[hsl(152,60%,50%)] hover:via-[hsl(160,65%,48%)] hover:to-[hsl(168,60%,47%)]",
        "hover:scale-[1.02] active:scale-[0.98]",
        glow && "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground",
        "hover:bg-secondary/80",
        "hover:scale-[1.02] active:scale-[0.98]",
        glow && "shadow-md hover:shadow-lg"
      ),
      outline: cn(
        "border-2 border-primary/40 text-foreground",
        "hover:border-primary hover:bg-primary/5",
        "hover:scale-[1.02] active:scale-[0.98]",
        glow && "hover:shadow-[0_0_30px_-8px_hsl(152,60%,50%/0.5)]"
      ),
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
        {/* Shimmer effect on primary variant */}
        {variant === "primary" && !loading && (
          <span
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-slide_3s_ease-in-out_infinite]"
              style={{ animationDelay: '1s' }}
            />
          </span>
        )}

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {children}
        </span>
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export default GradientButton;
