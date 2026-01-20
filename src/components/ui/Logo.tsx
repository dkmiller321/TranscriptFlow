'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
  lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
  xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { icon, text, gap } = sizes[size];

  return (
    <div className={cn('flex items-center', gap, className)}>
      <LogoMark size={icon} />
      {showText && (
        <span className={cn('font-display font-semibold tracking-tight', text)}>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Transcript
          </span>
          <span className="text-foreground">Flow</span>
        </span>
      )}
    </div>
  );
}

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TranscriptFlow logo"
    >
      <defs>
        {/* Main gradient for the play button shape */}
        <linearGradient id="logo-gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        {/* Glow effect */}
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle inner shadow for depth */}
        <filter id="logo-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.2" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#logo-gradient-main)"
        opacity="0.15"
      />

      {/* Rounded square border with gradient */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="none"
        stroke="url(#logo-gradient-main)"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Text lines representing transcript - flowing effect */}
      <g filter="url(#logo-glow)">
        {/* Line 1 - longest */}
        <rect
          x="10"
          y="13"
          width="20"
          height="3"
          rx="1.5"
          fill="url(#logo-gradient-main)"
        />

        {/* Line 2 - medium */}
        <rect
          x="10"
          y="19"
          width="16"
          height="3"
          rx="1.5"
          fill="url(#logo-gradient-main)"
          opacity="0.8"
        />

        {/* Line 3 - short */}
        <rect
          x="10"
          y="25"
          width="12"
          height="3"
          rx="1.5"
          fill="url(#logo-gradient-main)"
          opacity="0.6"
        />

        {/* Line 4 - medium */}
        <rect
          x="10"
          y="31"
          width="14"
          height="3"
          rx="1.5"
          fill="url(#logo-gradient-main)"
          opacity="0.4"
        />
      </g>

      {/* Play button / Flow arrow - indicates video + motion */}
      <path
        d="M32 17 L40 24 L32 31 Z"
        fill="url(#logo-gradient-main)"
        filter="url(#logo-inner-shadow)"
      />

      {/* Flowing dots representing data flow */}
      <circle cx="36" cy="17" r="1.5" fill="url(#logo-gradient-main)" opacity="0.5" />
      <circle cx="39" cy="20" r="1" fill="url(#logo-gradient-main)" opacity="0.3" />
    </svg>
  );
}

// Favicon version - simplified for small sizes
export function LogoFavicon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="favicon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#favicon-gradient)" />

      {/* Simplified text lines */}
      <rect x="6" y="9" width="12" height="2.5" rx="1.25" fill="white" />
      <rect x="6" y="13.5" width="9" height="2.5" rx="1.25" fill="white" opacity="0.8" />
      <rect x="6" y="18" width="10" height="2.5" rx="1.25" fill="white" opacity="0.6" />

      {/* Play arrow */}
      <path d="M20 11 L26 16 L20 21 Z" fill="white" />
    </svg>
  );
}
