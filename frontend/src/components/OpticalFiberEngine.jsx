import React, { useMemo } from 'react';

/**
 * Sprint B2 — Optical Fiber Engine
 *
 * The signature visual engine of Lumyo.
 * Living optical fiber bundle originating physically from the Robot's cervical neck region.
 * Features:
 * - Origin: Compact bundle at cervical neck (approx 80% left, 14% top)
 * - Gradual opening into an elegant, floating organic fan
 * - Ultra-fine curved SVG Bezier fibers (1.0px - 1.5px)
 * - Luminous glowing tips as focal points (no flickering/blinking)
 * - 3D Depth tiers (opacity, stroke thickness, subtle blur)
 * - Positioned strictly behind text/interactive content (z-index 0)
 */
export default function OpticalFiberEngine({ className = '' }) {
  // Generate 18 individual optical fibers with unique organic trajectories
  const fibers = useMemo(() => {
    const originX = 80; // % from left (robot cervical neck)
    const originY = 14; // % from top

    const count = 18;
    return Array.from({ length: count }).map((_, i) => {
      // Fan angle spread: from -130deg (pointing left toward headline) to -45deg (pointing down toward cards)
      const t = i / (count - 1);
      
      // End coordinates spreading across the Hero and upper section
      const spreadX = originX - (45 + t * 40) + (Math.sin(i * 1.5) * 6); // 35% to 75%
      const spreadY = originY + (20 + t * 45) + (Math.cos(i * 1.2) * 5); // 34% to 80%

      // Bezier Control points for soft organic curvature
      const cp1X = originX - (15 + t * 20);
      const cp1Y = originY + (5 + Math.sin(i) * 10);

      const cp2X = originX - (30 + t * 25);
      const cp2Y = spreadY - (10 - Math.cos(i) * 8);

      // Depth tier: 0 (background), 1 (midground), 2 (foreground)
      const depthTier = i % 3;
      const strokeWidth = depthTier === 0 ? 0.9 : depthTier === 1 ? 1.2 : 1.5;
      const opacity = depthTier === 0 ? 0.35 : depthTier === 1 ? 0.65 : 0.85;

      // Color scheme: Electric Blue -> Violet -> Magenta tip accent
      const isMagentaAccent = i % 4 === 0;
      const tipColor = isMagentaAccent ? '#ff2d78' : '#3d62ff';
      const tipGlow = isMagentaAccent ? 'rgba(255, 45, 120, 0.85)' : 'rgba(61, 98, 255, 0.9)';

      // Path data string
      const pathD = `M ${originX} ${originY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${spreadX} ${spreadY}`;

      return {
        id: i,
        pathD,
        endX: spreadX,
        endY: spreadY,
        strokeWidth,
        opacity,
        tipColor,
        tipGlow,
        tier: depthTier,
        dur: 7 + (i % 5) * 1.5, // Wave pulse duration
        delay: (i % 4) * 0.8,
      };
    });
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ filter: 'drop-shadow(0 0 10px rgba(61, 98, 255, 0.25))' }}
      >
        <defs>
          {/* Main Fiber Gradient: Compact White/Cyan at Neck -> Blue/Violet -> Radiant Tip */}
          <linearGradient id="fiberGradDefault" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#8fb4ff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#3d62ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#9b24e6" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="fiberGradAccent" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#ff7ba9" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#ff2d78" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#9b24e6" stopOpacity="0.4" />
          </linearGradient>

          {/* Luminous Tip Filter Glow */}
          <filter id="tipGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render Fiber Strands */}
        {fibers.map((f) => (
          <g key={f.id} style={{ opacity: f.opacity }}>
            {/* Fiber Line */}
            <path
              d={f.pathD}
              fill="none"
              stroke={f.id % 4 === 0 ? 'url(#fiberGradAccent)' : 'url(#fiberGradDefault)'}
              strokeWidth={f.strokeWidth * 0.15} // Scaled for 0-100 viewBox
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{
                animation: `energyBreathing ${f.dur}s ease-in-out infinite ${f.delay}s`,
              }}
            />

            {/* Luminous Glowing Tip Node */}
            <circle
              cx={f.endX}
              cy={f.endY}
              r={f.tier === 2 ? 0.45 : f.tier === 1 ? 0.35 : 0.25}
              fill={f.tipColor}
              filter="url(#tipGlowFilter)"
              style={{
                boxShadow: `0 0 10px ${f.tipGlow}`,
                animation: `energyBreathing ${f.dur}s ease-in-out infinite ${f.delay}s`,
              }}
            />
            {/* Inner White Specular Tip Core */}
            <circle
              cx={f.endX}
              cy={f.endY}
              r={f.tier === 2 ? 0.2 : 0.12}
              fill="#ffffff"
            />
          </g>
        ))}

        {/* Cervical Origin Node — Compact Bundle Glow at Robot Neck */}
        <circle
          cx={80}
          cy={14}
          r={1.2}
          fill="rgba(255, 255, 255, 0.95)"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(61, 98, 255, 0.95)) drop-shadow(0 0 25px rgba(255, 45, 120, 0.75))',
            animation: 'energyBreathing 6s ease-in-out infinite',
          }}
        />
      </svg>
    </div>
  );
}
