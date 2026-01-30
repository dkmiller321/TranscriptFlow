"use client";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Animated gradient blobs - Eucalyptus Grove palette */}
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-sage-500/20 blur-[120px] animate-float animate-morph"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute top-1/4 -right-1/4 w-2/5 h-2/5 rounded-full bg-forest-500/25 blur-[100px] animate-float-delayed animate-morph"
        style={{ animationDelay: '5s' }}
      />
      <div
        className="absolute -bottom-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-stone-500/15 blur-[100px] animate-float-slow animate-morph"
        style={{ animationDelay: '10s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-cream-500/10 blur-[80px] animate-float"
        style={{ animationDelay: '3s' }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
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
