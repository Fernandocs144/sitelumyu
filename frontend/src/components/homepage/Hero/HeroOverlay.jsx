import React from 'react';

export default function HeroOverlay() {
  

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-hidden"
    >
      <div
    data-hero-robot
    className="absolute inset-0"
/>

      <div
    data-fiber-layer
    className="absolute inset-0"
/>

      <div data-card-layer className="absolute inset-0" />

      <div data-logo-layer className="absolute inset-0" />

      <div data-diamond-layer className="absolute inset-0" />

      <div data-galaxy-layer className="absolute inset-0" />
    </div>
  );
}