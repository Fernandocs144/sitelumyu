import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const HERO_SCROLL_CONFIG = {
  SCROLL_DISTANCE: '+=300vh',
  START: 'top top',
  PIN: true,
  SCRUB: true,
  ANTICIPATE_PIN: 1,
  INVALIDATE_ON_REFRESH: true,
};

export function createHeroTimeline(triggerElement, viewportElement) {
  if (!triggerElement || !viewportElement) return null;

  return gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      pin: viewportElement,
      start: HERO_SCROLL_CONFIG.START,
      end: HERO_SCROLL_CONFIG.SCROLL_DISTANCE,
      scrub: HERO_SCROLL_CONFIG.SCRUB,
      pinSpacing: true,
      anticipatePin: HERO_SCROLL_CONFIG.ANTICIPATE_PIN,
      invalidateOnRefresh: HERO_SCROLL_CONFIG.INVALIDATE_ON_REFRESH,
    },
  });
}