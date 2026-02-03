"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  gradient?: boolean;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  staggerDelay?: number;
}

export function AnimatedText({
  text,
  className,
  gradient = false,
  delay = 0,
  as: Component = "span",
  staggerDelay = 0.03,
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Split text into words, preserving spaces
  const words = text.split(" ");

  return (
    <Component
      ref={containerRef as React.RefObject<HTMLHeadingElement>}
      className={cn(
        "inline-block",
        gradient && "gradient-text-animated",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-pre">
          {word.split("").map((char, charIndex) => {
            const overallIndex =
              words.slice(0, wordIndex).join(" ").length +
              (wordIndex > 0 ? 1 : 0) +
              charIndex;

            return (
              <span
                key={charIndex}
                className={cn(
                  "inline-block transition-all duration-700",
                  isVisible
                    ? "opacity-100 translate-y-0 blur-0"
                    : "opacity-0 translate-y-4 blur-[2px]"
                )}
                style={{
                  transitionDelay: `${overallIndex * staggerDelay}s`,
                  transformStyle: "preserve-3d",
                }}
              >
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </Component>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

export function TypewriterText({
  text,
  className,
  speed = 50,
  delay = 0,
  cursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startTyping = () => {
      let currentIndex = 0;

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutId = setTimeout(typeNextChar, speed);
        } else {
          // Blink cursor after typing is complete
          const blinkInterval = setInterval(() => {
            setShowCursor((prev) => !prev);
          }, 500);
          return () => clearInterval(blinkInterval);
        }
      };

      timeoutId = setTimeout(typeNextChar, delay);
    };

    startTyping();

    return () => clearTimeout(timeoutId);
  }, [text, speed, delay]);

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      {cursor && (
        <span
          className={cn(
            "inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle transition-opacity",
            showCursor ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </span>
  );
}

interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlowText({
  children,
  className,
  intensity = "medium",
}: GlowTextProps) {
  const intensityStyles = {
    low: "text-glow",
    medium: "text-glow-intense",
    high: "text-glow-intense animate-pulse-soft",
  };

  return (
    <span className={cn(intensityStyles[intensity], className)}>{children}</span>
  );
}
