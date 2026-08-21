"use client";

// A wave shape wide enough to tile seamlessly when two copies sit side by
// side and the pair is scrolled left by exactly 50% of its own width.
const WAVE_PATH =
  "M0,60 C150,110 350,10 600,60 C850,110 1050,10 1200,60 L1200,200 L0,200 Z";

function WaveLayer({
  color,
  opacity,
  duration,
  bottom,
  scale = 1,
}: {
  color: string;
  opacity: number;
  duration: number;
  bottom: number;
  scale?: number;
}) {
  return (
    <div
      className="absolute right-0 left-0"
      style={{ bottom, height: 200 * scale, opacity }}
    >
      <div
        className="flex h-full w-[200%]"
        style={{ animation: `hero-wave-drift ${duration}s linear infinite` }}
      >
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="h-full w-1/2">
          <path d={WAVE_PATH} fill={color} />
        </svg>
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="h-full w-1/2">
          <path d={WAVE_PATH} fill={color} />
        </svg>
      </div>
    </div>
  );
}

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,58,138,0.25),transparent_60%)]" />

      {/* Layered undulating waves, back to front */}
      <WaveLayer color="rgba(30,64,175,0.18)" opacity={1} duration={26} bottom={-40} scale={1.1} />
      <WaveLayer color="rgba(59,90,190,0.22)" opacity={1} duration={19} bottom={-60} scale={1} />
      <WaveLayer color="rgba(96,120,220,0.16)" opacity={1} duration={14} bottom={-80} scale={0.9} />

      {/* Vignette so content stays legible over the motion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#080A19_88%)]" />
    </div>
  );
}
