import React from 'react';

/**
 * HeroBackground — Fullscreen background image layer.
 * Uses exclusively /images/homepage/hero-background.png with eager loading and high priority.
 */
export default function HeroBackground() {
  const bgPath = '/images/homepage/hero-background.png';

  return (
    <div
    data-hero-background
    className="absolute inset-0 z-0 h-full w-full overflow-hidden select-none pointer-events-none"
>
      <img
        src={bgPath}
        alt="Lumyo Hero Background"
        className="h-full w-full object-cover object-center"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}
