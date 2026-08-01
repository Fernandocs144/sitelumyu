import React, { useMemo } from 'react';

/**
 * Cosmic Dust Field — Multi-tier atmospheric micro-particles.
 * Tier 1: Distant micro-dust (small, soft ice/cyan)
 * Tier 2: Mid-ground dust (medium, soft electric/violet)
 * Tier 3: Out-of-focus foreground bokeh (blurred, low opacity)
 *
 * Performance-optimized CSS animation with high negative space preservation.
 */
export default function ParticleField({ count = 35, className = '' }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // 60% Distant, 30% Mid, 10% Foreground
      const tier = i % 10 < 6 ? 1 : i % 10 < 9 ? 2 : 3;

      let size, color, opacity, filter, dur, delay;

      if (tier === 1) {
        // Distant micro-dust
        size = 0.8 + Math.random() * 0.8; // 0.8px - 1.6px
        color = Math.random() > 0.4 ? 'rgba(180, 215, 255, 0.45)' : 'rgba(210, 190, 255, 0.40)';
        opacity = 0.25 + Math.random() * 0.35;
        filter = 'blur(0.3px)';
        dur = 6 + Math.random() * 6;
        delay = Math.random() * 6;
      } else if (tier === 2) {
        // Mid-ground dust
        size = 1.8 + Math.random() * 1.0; // 1.8px - 2.8px
        color = Math.random() > 0.5 ? 'rgba(100, 150, 255, 0.50)' : 'rgba(175, 110, 255, 0.45)';
        opacity = 0.30 + Math.random() * 0.35;
        filter = 'blur(0.8px)';
        dur = 5 + Math.random() * 5;
        delay = Math.random() * 5;
      } else {
        // Foreground out-of-focus bokeh
        size = 3.5 + Math.random() * 2.0; // 3.5px - 5.5px
        color = Math.random() > 0.5 ? 'rgba(255, 100, 170, 0.30)' : 'rgba(120, 140, 255, 0.35)';
        opacity = 0.12 + Math.random() * 0.18;
        filter = 'blur(2.5px)';
        dur = 7 + Math.random() * 5;
        delay = Math.random() * 5;
      }

      return {
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size,
        color,
        opacity,
        filter,
        dur,
        delay,
      };
    });
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-pulseGlow"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: p.size > 2 ? `0 0 ${p.size * 3}px ${p.color}` : 'none',
            filter: p.filter,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
