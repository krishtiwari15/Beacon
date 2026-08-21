"use client";

import { useEffect, useState } from "react";

type Particle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
};

export default function HeroBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generated client-side only, after mount, so server/client markup matches
    // (random values would otherwise cause a hydration mismatch).
    setParticles(
      Array.from({ length: 36 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 10 + Math.random() * 14,
        delay: Math.random() * -20,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Drifting grid */}
      <div
        className="absolute inset-[-50px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          animation: "hero-grid-drift 40s linear infinite",
        }}
      />

      {/* Particle field */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: 0.4,
            animation: `hero-particle-float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Vignette so content stays legible over the motion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#080A19_85%)]" />
    </div>
  );
}
