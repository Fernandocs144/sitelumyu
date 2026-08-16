import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const HERO_SCROLL_CONFIG = {
  START: 'top top',
  TOTAL_SCROLL_DISTANCE: 650,
  VIDEO_SCROLL_DISTANCE: 300,
  SCRUB: true,
  PIN_SPACING: true,
ANTICIPATE_PIN: 1,
};

export function createHeroScrollExperience(
  triggerElement,
  viewportElement,
  videoElement
) {
  if (!triggerElement || !viewportElement || !videoElement) {
    return null;
  }

  videoElement.pause();

  return ScrollTrigger.create({
    trigger: triggerElement,
    pin: viewportElement,

    start: HERO_SCROLL_CONFIG.START,
    end: `+=${HERO_SCROLL_CONFIG.TOTAL_SCROLL_DISTANCE}%`,

    scrub: HERO_SCROLL_CONFIG.SCRUB,
    pinSpacing: HERO_SCROLL_CONFIG.PIN_SPACING,
    anticipatePin: HERO_SCROLL_CONFIG.ANTICIPATE_PIN,

    onUpdate(self) {
  const duration = videoElement.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }

  /*
   * O palco total tem 600% de scroll,
   * mas o vídeo deve completar o movimento
   * aproximadamente nos primeiros 180%.
   *
   * 180 / 600 = 0.3
   */
  const totalScrollDistance =
  HERO_SCROLL_CONFIG.TOTAL_SCROLL_DISTANCE;

const videoEndProgress =
  HERO_SCROLL_CONFIG.VIDEO_SCROLL_DISTANCE /
  totalScrollDistance;

const videoProgress = Math.min(
  self.progress / videoEndProgress,
  1
);

videoElement.currentTime = videoProgress * duration;
},
  });
}