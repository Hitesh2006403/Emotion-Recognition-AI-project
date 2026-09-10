import React, { useMemo } from 'react';

// 72 deterministic particle coordinates and styles for zero-runtime overhead
const FIXED_PARTICLES = [
  { x: 5, y: 8, r: 2.2, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.7, lightOp: 0.55, anim: 'twinkle-1' },
  { x: 12, y: 15, r: 1.5, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.8, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 18, y: 6, r: 2.0, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-3' },
  { x: 25, y: 22, r: 1.2, darkCol: '#FFFFFF', lightCol: '#10B981', darkOp: 0.5, lightOp: 0.4, anim: 'twinkle-1' },
  { x: 32, y: 12, r: 2.5, darkCol: '#00F2FE', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-2' },
  { x: 42, y: 5, r: 1.4, darkCol: '#FFFFFF', lightCol: '#06B6D4', darkOp: 0.6, lightOp: 0.45, anim: 'twinkle-3' },
  { x: 48, y: 18, r: 2.0, darkCol: '#FBBF24', lightCol: '#F59E0B', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-1' },
  { x: 55, y: 9, r: 1.6, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.7, lightOp: 0.45, anim: 'twinkle-2' },
  { x: 63, y: 24, r: 2.2, darkCol: '#00F2FE', lightCol: '#10B981', darkOp: 0.8, lightOp: 0.55, anim: 'twinkle-3' },
  { x: 70, y: 14, r: 1.3, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.55, lightOp: 0.4, anim: 'twinkle-1' },
  { x: 78, y: 8, r: 2.4, darkCol: '#FFFFFF', lightCol: '#06B6D4', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-2' },
  { x: 86, y: 19, r: 1.5, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-3' },
  { x: 94, y: 11, r: 2.0, darkCol: '#00F2FE', lightCol: '#10B981', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-1' },
  
  // Mid-viewport particles (covering studio inputs, controls)
  { x: 4, y: 32, r: 1.8, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 10, y: 44, r: 2.5, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-3' },
  { x: 16, y: 38, r: 1.3, darkCol: '#A78BFA', lightCol: '#10B981', darkOp: 0.5, lightOp: 0.4, anim: 'twinkle-1' },
  { x: 22, y: 52, r: 2.0, darkCol: '#FBBF24', lightCol: '#F59E0B', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 28, y: 35, r: 1.5, darkCol: '#FFFFFF', lightCol: '#06B6D4', darkOp: 0.6, lightOp: 0.45, anim: 'twinkle-3' },
  { x: 36, y: 48, r: 2.2, darkCol: '#00F2FE', lightCol: '#4F46E5', darkOp: 0.8, lightOp: 0.55, anim: 'twinkle-1' },
  { x: 44, y: 36, r: 1.4, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-2' },
  { x: 52, y: 56, r: 2.0, darkCol: '#FFFFFF', lightCol: '#10B981', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-3' },
  { x: 60, y: 40, r: 1.6, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-1' },
  { x: 67, y: 50, r: 2.4, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-2' },
  { x: 74, y: 34, r: 1.3, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.55, lightOp: 0.4, anim: 'twinkle-3' },
  { x: 82, y: 46, r: 2.1, darkCol: '#FBBF24', lightCol: '#10B981', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-1' },
  { x: 90, y: 38, r: 1.5, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-2' },
  { x: 96, y: 54, r: 2.2, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.8, lightOp: 0.55, anim: 'twinkle-3' },

  // Lower-viewport particles (covering results, charts, attention gauges)
  { x: 6, y: 65, r: 2.0, darkCol: '#FFFFFF', lightCol: '#10B981', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-1' },
  { x: 14, y: 76, r: 1.4, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.6, lightOp: 0.45, anim: 'twinkle-2' },
  { x: 20, y: 62, r: 2.3, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.85, lightOp: 0.55, anim: 'twinkle-3' },
  { x: 26, y: 82, r: 1.5, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-1' },
  { x: 34, y: 70, r: 2.2, darkCol: '#FBBF24', lightCol: '#F59E0B', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 40, y: 88, r: 1.6, darkCol: '#00F2FE', lightCol: '#10B981', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-3' },
  { x: 48, y: 66, r: 2.5, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-1' },
  { x: 56, y: 78, r: 1.3, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.55, lightOp: 0.4, anim: 'twinkle-2' },
  { x: 64, y: 64, r: 2.0, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.8, lightOp: 0.5, anim: 'twinkle-3' },
  { x: 72, y: 84, r: 1.5, darkCol: '#FFFFFF', lightCol: '#10B981', darkOp: 0.65, lightOp: 0.45, anim: 'twinkle-1' },
  { x: 80, y: 72, r: 2.4, darkCol: '#FBBF24', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-2' },
  { x: 88, y: 86, r: 1.4, darkCol: '#A78BFA', lightCol: '#A855F7', darkOp: 0.6, lightOp: 0.45, anim: 'twinkle-3' },
  { x: 95, y: 68, r: 2.1, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-1' },

  // Deep bottom viewport particles (covering footer, metrics)
  { x: 8, y: 92, r: 1.8, darkCol: '#FFFFFF', lightCol: '#4F46E5', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 24, y: 96, r: 2.2, darkCol: '#00F2FE', lightCol: '#06B6D4', darkOp: 0.8, lightOp: 0.55, anim: 'twinkle-3' },
  { x: 42, y: 94, r: 1.5, darkCol: '#A78BFA', lightCol: '#10B981', darkOp: 0.6, lightOp: 0.45, anim: 'twinkle-1' },
  { x: 58, y: 95, r: 2.0, darkCol: '#FFFFFF', lightCol: '#A855F7', darkOp: 0.75, lightOp: 0.5, anim: 'twinkle-2' },
  { x: 76, y: 93, r: 1.6, darkCol: '#FBBF24', lightCol: '#F59E0B', darkOp: 0.7, lightOp: 0.5, anim: 'twinkle-3' },
  { x: 92, y: 97, r: 2.3, darkCol: '#00F2FE', lightCol: '#4F46E5', darkOp: 0.85, lightOp: 0.6, anim: 'twinkle-1' },
];

export function AmbientBackground() {
  const particles = useMemo(() => FIXED_PARTICLES, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* 1. Base Canvas Color Layer */}
      <div className="absolute inset-0 bg-[#F8F9FA] dark:bg-[#080B10] transition-colors duration-500" />

      {/* 2. Full-Page Dynamic Atmospheric Mesh Wash (Aurora in Light / Nebula in Dark) */}
      <div className="ambient-aurora-page" />

      {/* 3. Floating Luminous Aurora / Nebula Atmospheric Orbs (Rich color presence across all scroll heights) */}
      {/* Orb 1: Upper-Left (Indigo in Light, Cyan in Dark) */}
      <div className="absolute w-[680px] h-[680px] -top-[12%] -left-[8%] rounded-full blur-[100px] bg-indigo-500/26 dark:bg-cyan-500/12 animate-aurora-orb-1 transition-colors duration-700" />

      {/* Orb 2: Upper-Right (Cyan in Light, Amethyst in Dark) */}
      <div className="absolute w-[620px] h-[620px] top-[18%] -right-[10%] rounded-full blur-[90px] bg-cyan-400/28 dark:bg-purple-600/14 animate-aurora-orb-2 transition-colors duration-700" />

      {/* Orb 3: Lower-Left / Mid Studio (Mint in Light, Deep Indigo in Dark) */}
      <div className="absolute w-[720px] h-[720px] top-[50%] -left-[10%] rounded-full blur-[110px] bg-emerald-400/24 dark:bg-indigo-950/30 animate-aurora-orb-3 transition-colors duration-700" />

      {/* Orb 4: Lower-Right / Results & Footer (Violet in Light, Cyan in Dark) */}
      <div className="absolute w-[600px] h-[600px] top-[75%] -right-[8%] rounded-full blur-[95px] bg-purple-400/22 dark:bg-cyan-600/10 animate-aurora-orb-4 transition-colors duration-700" />

      {/* 4. Persistent Subtle Full-Page Particle Field (Star Dust in Dark / Chromatic Aurora Particles in Light) */}
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {particles.map((p, idx) => (
          <circle
            key={idx}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.r}
            className={`ambient-particle ${p.anim}`}
            style={{
              '--dark-col': p.darkCol,
              '--light-col': p.lightCol,
              '--dark-op': p.darkOp,
              '--light-op': p.lightOp,
            }}
          />
        ))}
      </svg>

      {/* 5. Precision Architectural Dot Grid (Persistent Across Full Page) */}
      <div className="ambient-dot-grid-page" />

      {/* 6. Tactile Procedural Micro-Noise Texture */}
      <div className="ambient-noise-page" />

      {/* 7. Viewport Edge Vignette */}
      <div className="ambient-vignette-page" />
    </div>
  );
}

export default AmbientBackground;
