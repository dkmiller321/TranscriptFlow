"use client";

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = false, glow = false, children, ...props }, ref) => {
    const variants = {
      default: "glass",
      strong: "glass-strong",
      subtle: "glass-subtle",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          "rounded-2xl",
          hover && "hover-lift cursor-pointer",
          glow && "hover-glow",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
