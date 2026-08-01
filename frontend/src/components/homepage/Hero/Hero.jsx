import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroBackground from './HeroBackground';
import HeroOverlay from './HeroOverlay';
import HeroContent from './HeroContent';
import { createHeroTimeline } from './HeroTimeline';

/**
 * Hero — Single Source of Truth Hero Component (Sprint 0A).
 *
 * Architecture:
 * - Outer Section: relative h-screen w-full (no CSS sticky, no 300vh height override)
 * - Inner Viewport: relative h-screen w-full overflow-hidden (pinned by GSAP ScrollTrigger)
 * - Lifecycle: Safely managed using useLayoutEffect and gsap.context()
 */
export default function Hero() {
  const triggerRef = useRef(null);
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const timelineRef = useRef(null);

  useLayoutEffect(() => {
    if (!triggerRef.current || !viewportRef.current) return;

    // Use gsap.context for clean scope and automatic, leak-free cleanup
    const ctx = gsap.context(() => {
      const timeline = createHeroTimeline(
        triggerRef.current,
        viewportRef.current
      );
      timelineRef.current = timeline;
    }, triggerRef);

    // Refresh ScrollTrigger after initial layout calculation
    ScrollTrigger.refresh();

    return () => {
      ctx.revert(); // Reverts animations and kills ONLY ScrollTriggers created in this context
    };
  }, []);

  return (
    <section
      ref={triggerRef}
      data-testid="hero-scroll-container"
      className="relative h-screen w-full"
    >
      <div
        ref={viewportRef}
        data-testid="hero-pinned-viewport"
        className="relative h-screen w-full overflow-hidden"
      >
        {/* Layer 1: Fullscreen Background PNG */}
        <HeroBackground />

        {/* Layer 2: Positioned Overlay Layer */}
        <HeroOverlay />

        {/* Layer 3: Independent Content Layer */}
        <HeroContent ref={contentRef} />
      </div>
    </section>
  );
}
