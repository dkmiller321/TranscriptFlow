"use client";

import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Check if mobile
    const isMobile = window.innerWidth < 640;

    if (prefersReducedMotion || isMobile) return;

    let animationId: number;
    let particles: Particle[] = [];
    let gridLines: GridLine[] = [];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }

    interface GridLine {
      x: number;
      y: number;
      isVertical: boolean;
      opacity: number;
      targetOpacity: number;
      pulsePhase: number;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
      initGridLines();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(30, Math.floor(canvas.width * canvas.height / 50000));

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          hue: 152 + Math.random() * 30, // Teal to cyan range
        });
      }
    };

    const initGridLines = () => {
      gridLines = [];
      const spacing = 80;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += spacing) {
        gridLines.push({
          x,
          y: 0,
          isVertical: true,
          opacity: 0,
          targetOpacity: 0.02 + Math.random() * 0.02,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += spacing) {
        gridLines.push({
          x: 0,
          y,
          isVertical: false,
          opacity: 0,
          targetOpacity: 0.02 + Math.random() * 0.02,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawGrid = (time: number) => {
      gridLines.forEach((line) => {
        const pulse = Math.sin(time * 0.001 + line.pulsePhase) * 0.5 + 0.5;
        line.opacity = line.targetOpacity * (0.5 + pulse * 0.5);

        ctx.strokeStyle = `hsla(165, 50%, 50%, ${line.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (line.isVertical) {
          ctx.moveTo(line.x, 0);
          ctx.lineTo(line.x, canvas.height);
        } else {
          ctx.moveTo(0, line.y);
          ctx.lineTo(canvas.width, line.y);
        }

        ctx.stroke();
      });
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.opacity})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 50%, ${p.opacity * 0.3})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 40%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawConnections = () => {
      const connectionDistance = 150;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.08;
            ctx.strokeStyle = `hsla(165, 60%, 50%, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(time);
      drawConnections();
      drawParticles();

      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Canvas for particles and grid */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 hidden sm:block"
        style={{ opacity: 0.8 }}
      />

      {/* Animated gradient blobs - optimized for mobile */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full
          blur-[60px] sm:blur-[150px]
          sm:animate-float sm:animate-morph"
        style={{
          background: "radial-gradient(circle, hsla(152, 60%, 40%, 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full
          blur-[60px] sm:blur-[120px]
          sm:animate-float-delayed sm:animate-morph"
        style={{
          background: "radial-gradient(circle, hsla(165, 70%, 45%, 0.18) 0%, transparent 70%)",
        }}
      />
      {/* Hide extra blobs on mobile for performance */}
      <div
        className="hidden sm:block absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] animate-float-slow animate-morph"
        style={{
          background: "radial-gradient(circle, hsla(180, 60%, 45%, 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[80px] animate-float"
        style={{
          background: "radial-gradient(circle, hsla(165, 80%, 50%, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient overlay for depth - vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 0%, hsl(220, 20%, 3%) 100%)",
          opacity: 0.4,
        }}
      />

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
