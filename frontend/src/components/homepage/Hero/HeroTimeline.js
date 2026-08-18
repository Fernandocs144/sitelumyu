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

  const duration = videoElement.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const totalScrollDistance =
    HERO_SCROLL_CONFIG.TOTAL_SCROLL_DISTANCE;

  const videoEndProgress =
    HERO_SCROLL_CONFIG.VIDEO_SCROLL_DISTANCE /
    totalScrollDistance;

  const isMobile = window.matchMedia(
    '(max-width: 767px)'
  ).matches;

  let targetTime = 0;
  let currentTime = 0;
  let rafId = null;

  /*
   * Em desktop podemos aproximar mais rapidamente o frame pretendido.
   * Em mobile fazemos uma interpolação mais suave para evitar
   * dezenas de seeks agressivos no vídeo durante o scroll.
   */
  const smoothing = isMobile ? 0.12 : 0.22;

  /*
   * Evita alterar currentTime por diferenças insignificantes.
   */
  const minTimeDifference = isMobile ? 0.025 : 0.012;

  const updateVideo = () => {
    currentTime += (targetTime - currentTime) * smoothing;

    if (
      Math.abs(videoElement.currentTime - currentTime) >
      minTimeDifference
    ) {
      try {
        videoElement.currentTime = currentTime;
      } catch {
        // O browser pode temporariamente rejeitar seeks
        // enquanto o vídeo ainda está a estabilizar.
      }
    }

    if (Math.abs(targetTime - currentTime) > 0.01) {
      rafId = requestAnimationFrame(updateVideo);
    } else {
      currentTime = targetTime;

      try {
        videoElement.currentTime = targetTime;
      } catch {
        // Ignorar seek inválido temporário.
      }

      rafId = null;
    }
  };

  const scrollTrigger = ScrollTrigger.create({
    trigger: triggerElement,
    pin: viewportElement,

    start: HERO_SCROLL_CONFIG.START,
    end: `+=${HERO_SCROLL_CONFIG.TOTAL_SCROLL_DISTANCE}%`,

    scrub: HERO_SCROLL_CONFIG.SCRUB,
    pinSpacing: HERO_SCROLL_CONFIG.PIN_SPACING,
    anticipatePin: HERO_SCROLL_CONFIG.ANTICIPATE_PIN,

    onUpdate(self) {
      const videoProgress = Math.min(
        self.progress / videoEndProgress,
        1
      );

      targetTime = videoProgress * duration;

      if (rafId === null) {
        rafId = requestAnimationFrame(updateVideo);
      }
    },

    onKill() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  });

  return scrollTrigger;
}