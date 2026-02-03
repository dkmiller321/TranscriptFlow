"use client";

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
  hover?: boolean;
  glow?: boolean;
  glowColor?: "primary" | "electric" | "multi";
  animated?: boolean;
  noise?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = "default",
      hover = false,
      glow = false,
      glowColor = "primary",
      animated = false,
      noise = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: cn(
        "bg-card/60 dark:bg-card/40",
        "border border-border/50 dark:border-white/[0.06]",
        "backdrop-blur-xl",
        "shadow-lg shadow-black/5 dark:shadow-black/20"
      ),
      strong: cn(
        "bg-card/80 dark:bg-card/50",
        "border border-border/60 dark:border-white/[0.08]",
        "backdrop-blur-2xl",
        "shadow-xl shadow-black/10 dark:shadow-black/30"
      ),
      subtle: cn(
        "bg-card/40 dark:bg-card/25",
        "border border-border/30 dark:border-white/[0.04]",
        "backdrop-blur-lg",
        "shadow-md shadow-black/5 dark:shadow-black/15"
      ),
    };

    const glowStyles = {
      primary: "hover:shadow-[0_0_50px_-12px_hsl(152,60%,50%/0.4)] dark:hover:shadow-[0_0_60px_-12px_hsl(152,60%,50%/0.5)]",
      electric: "hover:shadow-[0_0_60px_-12px_hsl(165,100%,50%/0.4)] dark:hover:shadow-[0_0_70px_-12px_hsl(165,100%,50%/0.5)]",
      multi: cn(
        "hover:shadow-[0_0_80px_-15px_hsl(152,60%,50%/0.3),0_0_50px_-10px_hsl(165,80%,50%/0.25),0_0_30px_-5px_hsl(180,70%,50%/0.2)]",
        "dark:hover:shadow-[0_0_100px_-15px_hsl(152,60%,50%/0.4),0_0_60px_-10px_hsl(165,80%,50%/0.3),0_0_40px_-5px_hsl(180,70%,50%/0.25)]"
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "transition-all duration-300 ease-out",
          variants[variant],
          hover && cn(
            "cursor-pointer",
            "hover:-translate-y-1",
            "hover:border-primary/20 dark:hover:border-primary/30",
            "active:translate-y-0 active:scale-[0.99]"
          ),
          glow && glowStyles[glowColor],
          animated && "animate-border-glow",
          className
        )}
        {...props}
      >
        {/* Inner highlight for depth */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)",
          }}
        />

        {/* Noise texture for premium feel */}
        {noise && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay rounded-2xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
