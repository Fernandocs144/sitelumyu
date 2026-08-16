import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const PERSISTENT_STAGE_CONFIG = {
  SCROLL_DISTANCE: '+=500%',
  START: 'top top',
  PIN: true,
  SCRUB: 0.8,
  ANTICIPATE_PIN: 1,
  INVALIDATE_ON_REFRESH: true,
};

/**
 * createPersistentHomeExperience
 *
 * Single global GSAP ScrollTrigger timeline orchestrating the continuous editorial transformation
 * of the 7 post-Hero moments over the Persistent Visual Stage.
 */
export function createPersistentHomeExperience(triggerElement, stageElement, momentsRef) {
  if (!triggerElement || !stageElement) return null;

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  const {
    srv1, srv2, srv3,
    capab,
    work,
    pos,
    why,
    biz,
    contact,
    bgOrb1, bgOrb2
  } = momentsRef;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      pin: stageElement,
      start: PERSISTENT_STAGE_CONFIG.START,
      end: PERSISTENT_STAGE_CONFIG.SCROLL_DISTANCE,
      scrub: PERSISTENT_STAGE_CONFIG.SCRUB,
      pinSpacing: true,
      anticipatePin: PERSISTENT_STAGE_CONFIG.ANTICIPATE_PIN,
      invalidateOnRefresh: PERSISTENT_STAGE_CONFIG.INVALIDATE_ON_REFRESH,
    },
  });

  // --- Initial Setup: Set starting states ---
  const allMoments = [srv1, srv2, srv3, capab, work, pos, why, biz, contact];
  allMoments.forEach((el) => {
    if (el) {
      gsap.set(el, { opacity: 0, y: 50, pointerEvents: 'none' });
    }
  });

  // Moment 01: Service 01 starts active
  if (srv1) gsap.set(srv1, { opacity: 1, y: 0, pointerEvents: 'auto' });

  // --- TIMELINE SEQUENCING (0 to 1 progress) ---

  // 1. Service 01 -> Service 02
  tl.to(srv1, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.4')
    .to(bgOrb1, { scale: 1.2, x: 80, duration: 0.8 }, '<')
    .to(srv2, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.8 }, '<+0.2');

  // 2. Service 02 -> Service 03
  tl.to(srv2, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.4')
    .to(bgOrb2, { scale: 1.3, y: -60, duration: 0.8 }, '<')
    .to(srv3, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.8 }, '<+0.2');

  // 3. Service 03 -> Capabilities
  tl.to(srv3, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.4')
    .to(capab, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1 }, '<+0.2');

  // 4. Capabilities -> Selected Work
  tl.to(capab, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.5')
    .to(bgOrb1, { scale: 0.9, x: -100, duration: 0.8 }, '<')
    .to(work, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1 }, '<+0.2');

  // 5. Selected Work -> Lumyo Positioning
  tl.to(work, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.5')
    .to(pos, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1.2 }, '<+0.2');

  // 6. Lumyo Positioning -> Why Lumyo
  tl.to(pos, { opacity: 0, scale: 0.95, pointerEvents: 'none', duration: 0.8 }, '+=0.5')
    .to(why, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1 }, '<+0.2');

  // 7. Why Lumyo -> Business Approach
  tl.to(why, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.5')
    .to(biz, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1 }, '<+0.2');

  // 8. Business Approach -> Integrated Contact
  tl.to(biz, { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.8 }, '+=0.5')
    .to(bgOrb1, { scale: 1.4, opacity: 0.4, duration: 1 }, '<')
    .to(contact, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1.2 }, '<+0.2');

  return tl;
}
