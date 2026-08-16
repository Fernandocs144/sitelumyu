import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}


/**
 * Cria a animação de entrada do Footer da Home.
 *
 * O Footer já está fisicamente sobreposto ao último viewport
 * do Hero através da Home.
 *
 * Esta timeline limita-se a revelar o painel glass durante
 * o scroll. Não interfere com:
 *
 * - HeroTimeline
 * - HeroContentTimeline
 * - vídeo
 * - pin do Hero
 */
export function createHomeFooterExperience(footerElement) {
  if (!footerElement) {
    return null;
  }


  const panel = footerElement.querySelector(
    '[data-home-footer-panel]'
  );


  if (!panel) {
    return null;
  }


  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: footerElement,

      /*
       * A animação começa quando o Footer entra
       * na zona inferior do viewport.
       */
      start: 'top 95%',

      /*
       * Termina quando o Footer já entrou
       * suficientemente na composição.
       */
      end: 'top 60%',

      scrub: true,

      invalidateOnRefresh: true,
    },
  });


  timeline.fromTo(
    panel,
    {
      opacity: 0,
      y: 70,
    },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'none',
    }
  );


  return timeline;
}