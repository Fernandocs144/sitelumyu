import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { createHeroContentExperience } from './HeroContentTimeline';
import HeroBackground from './HeroBackground';
import HeroContent from './HeroContent';
import { createHeroScrollExperience } from './HeroTimeline';


if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}


/**
 * Hero
 *
 * Estrutura:
 * - HeroBackground: poster + vídeo controlado pelo scroll
 * - HeroContent: toda a experiência editorial
 * - HeroTimeline: controla vídeo + pin
 * - HeroContentTimeline: controla textos e cenas
 */
export default function Hero() {
  const triggerRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRef = useRef(null);


  useLayoutEffect(() => {
    const triggerElement = triggerRef.current;
    const viewportElement = viewportRef.current;
    const video = videoRef.current;


    if (!triggerElement || !viewportElement || !video) {
      return undefined;
    }


    let heroScrollTrigger = null;
    let heroContentTimeline = null;
    let isInitialized = false;


    const setupScroll = () => {
      if (isInitialized) {
        return;
      }


      const duration = video.duration;


      if (!Number.isFinite(duration) || duration <= 0) {
        return;
      }


      try {
        video.pause();
        video.currentTime = 0;
      } catch {
        return;
      }


      heroScrollTrigger = createHeroScrollExperience(
        triggerElement,
        viewportElement,
        video
      );


      if (!heroScrollTrigger) {
        return;
      }


      heroContentTimeline =
        createHeroContentExperience(triggerElement);


      isInitialized = true;

      ScrollTrigger.refresh();
    };


    if (
      video.readyState >= 1 &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      setupScroll();
    } else {
      video.addEventListener(
        'loadedmetadata',
        setupScroll
      );

      video.addEventListener(
        'loadeddata',
        setupScroll
      );

      video.addEventListener(
        'canplay',
        setupScroll
      );
    }


    return () => {
      video.removeEventListener(
        'loadedmetadata',
        setupScroll
      );

      video.removeEventListener(
        'loadeddata',
        setupScroll
      );

      video.removeEventListener(
        'canplay',
        setupScroll
      );


      if (heroScrollTrigger) {
        heroScrollTrigger.kill();
      }


      if (heroContentTimeline) {
        heroContentTimeline.scrollTrigger?.kill();
        heroContentTimeline.kill();
      }
    };
  }, []);


  return (
    <section
      ref={triggerRef}
      data-testid="hero-scroll-container"
      className="relative min-h-screen w-full"
    >
      <div
        ref={viewportRef}
        data-testid="hero-pinned-viewport"
        className="
          relative
          min-h-screen
          w-full
          overflow-visible
          flex
          flex-col
          justify-between
        "
      >
        <HeroBackground ref={videoRef} />

        <HeroContent />
      </div>
    </section>
  );
}