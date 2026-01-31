"use client";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Animated gradient blobs - DISABLED on mobile for performance */}
      {/* Desktop only: animate-float, animate-morph, heavy blur */}
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-sage-500/20
          blur-[40px] sm:blur-[120px]
          sm:animate-float sm:animate-morph"
      />
      <div
        className="absolute top-1/4 -right-1/4 w-2/5 h-2/5 rounded-full bg-forest-500/25
          blur-[40px] sm:blur-[100px]
          sm:animate-float-delayed sm:animate-morph"
      />
      {/* Hide extra blobs on mobile */}
      <div
        className="hidden sm:block absolute -bottom-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-stone-500/15 blur-[100px] animate-float-slow animate-morph"
      />
      <div
        className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-cream-500/10 blur-[80px] animate-float"
      />

      {/* Subtle grid overlay - hidden on mobile */}
      <div
        className="hidden sm:block absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
