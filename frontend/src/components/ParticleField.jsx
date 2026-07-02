import React, { useMemo } from 'react';

// Lightweight CSS particle field — moderate animation, no heavy canvas loop.
export default function ParticleField({ count = 40, className = '' }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        dur: Math.random() * 4 + 4,
        pink: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full animate-pulseGlow"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background: d.pink ? '#ff3d9a' : '#6d8bff',
            boxShadow: `0 0 ${d.size * 4}px ${d.pink ? '#ff2d78' : '#4b6bff'}`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
