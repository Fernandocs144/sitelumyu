import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);


/* =========================================================
   FLOW TIMELINE
   ========================================================= */

function createFlowTimeline({
  sectionElement,
  flowId,
  destinationCard,
  scrollTriggerId,
}) {
  const flow = sectionElement.querySelector(
    `[data-service-flow="${flowId}"]`
  );

  const path = sectionElement.querySelector(
    `[data-flow-path="${flowId}"]`
  );

  const streams = Array.from(
    sectionElement.querySelectorAll(
      `[data-flow-stream="${flowId}"]`
    )
  );

  const pulse = sectionElement.querySelector(
    `[data-flow-pulse="${flowId}"]`
  );

  const secondaryPulse = sectionElement.querySelector(
    `[data-flow-pulse-secondary="${flowId}"]`
  );

  const tertiaryPulse = sectionElement.querySelector(
    `[data-flow-pulse-tertiary="${flowId}"]`
  );

  if (!flow || !path || !pulse) {
    return null;
  }


  /* =========================================================
     PREPARAR PATH PRINCIPAL
     ========================================================= */

  const pathLength = path.getTotalLength();

  gsap.set(path, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength,
  });


  /* =========================================================
     PREPARAR STREAMS
     ========================================================= */

  streams.forEach((stream) => {
    const streamLength = stream.getTotalLength();

    gsap.set(stream, {
      strokeDasharray: streamLength,
      strokeDashoffset: streamLength,
    });
  });


  /* =========================================================
     PREPARAR PULSOS
     ========================================================= */

  const pulses = [
    pulse,
    secondaryPulse,
    tertiaryPulse,
  ].filter(Boolean);

  gsap.set(pulses, {
    opacity: 0,
  });


  /* =========================================================
     TIMELINE
     ========================================================= */

  const timeline = gsap.timeline({
    defaults: {
      ease: 'none',
    },

    scrollTrigger: {
      id: scrollTriggerId,

      trigger: flow,

      start: 'top 88%',
      end: 'bottom 42%',

      scrub: 0.65,

      invalidateOnRefresh: true,
      refreshPriority: -1,

      // DEBUG:
      // markers: true,
    },
  });


  /* =========================================================
     PATH PRINCIPAL
     ========================================================= */

  timeline.to(
    path,
    {
      strokeDashoffset: 0,
      duration: 1,
    },
    0
  );


  /* =========================================================
     STREAMS
     ========================================================= */

  streams.forEach((stream, index) => {
    timeline.to(
      stream,
      {
        strokeDashoffset: 0,
        duration: 0.92,
      },
      0.035 + index * 0.035
    );
  });


  /* =========================================================
     PULSO PRINCIPAL
     ========================================================= */

  timeline.fromTo(
    pulse,
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 0.06,
    },
    0.02
  );

  timeline.to(
    pulse,
    {
      motionPath: {
        path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
      },

      duration: 0.96,
    },
    0.02
  );

  timeline.to(
    pulse,
    {
      opacity: 0,
      duration: 0.08,
    },
    0.90
  );


  /* =========================================================
     PULSO SECUNDÁRIO
     ========================================================= */

  if (secondaryPulse) {
    timeline.fromTo(
      secondaryPulse,
      {
        opacity: 0,
      },
      {
        opacity: 0.85,
        duration: 0.05,
      },
      0.14
    );

    timeline.to(
      secondaryPulse,
      {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
        },

        duration: 0.76,
      },
      0.14
    );

    timeline.to(
      secondaryPulse,
      {
        opacity: 0,
        duration: 0.07,
      },
      0.84
    );
  }


  /* =========================================================
     PULSO TERCIÁRIO
     ========================================================= */

  if (tertiaryPulse) {
    timeline.fromTo(
      tertiaryPulse,
      {
        opacity: 0,
      },
      {
        opacity: 0.65,
        duration: 0.05,
      },
      0.27
    );

    timeline.to(
      tertiaryPulse,
      {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
        },

        duration: 0.63,
      },
      0.27
    );

    timeline.to(
      tertiaryPulse,
      {
        opacity: 0,
        duration: 0.07,
      },
      0.86
    );
  }


  /* =========================================================
     REVELAR CARD DE DESTINO
     ========================================================= */

  if (destinationCard) {
    timeline.to(
      destinationCard,
      {
        x: 0,
        y: 0,

        opacity: 1,

        scale: 1,

        filter: 'blur(0px)',

        duration: 0.30,

        ease: 'power2.out',
      },
      0.76
    );
  }


  return timeline;
}


/* =========================================================
   SERVICES FLOW EXPERIENCE
   ========================================================= */

export function createServicesFlowExperience(sectionElement) {
  if (!sectionElement) {
    return null;
  }


  /* =========================================================
     CARDS
     ========================================================= */

  const card01 = sectionElement.querySelector(
    '[data-service-card="01"]'
  );

  const card02 = sectionElement.querySelector(
    '[data-service-card="02"]'
  );

  const card03 = sectionElement.querySelector(
    '[data-service-card="03"]'
  );


  if (!card01) {
    return null;
  }


  /* =========================================================
     ESTADOS INICIAIS
     ========================================================= */

  gsap.set(card01, {
    x: -110,
    y: 35,

    opacity: 0,

    scale: 0.97,

    filter: 'blur(6px)',
  });


  if (card02) {
    gsap.set(card02, {
      x: 110,
      y: 35,

      opacity: 0,

      scale: 0.97,

      filter: 'blur(6px)',
    });
  }


  if (card03) {
    gsap.set(card03, {
      x: -110,
      y: 35,

      opacity: 0,

      scale: 0.97,

      filter: 'blur(6px)',
    });
  }


  /* =========================================================
     CARD 01

     Trigger = secção estável.
     Elemento animado = card.
     ========================================================= */

  const card01Timeline = gsap.timeline({
    scrollTrigger: {
      id: 'services-card-01',

      trigger: sectionElement,

      start: 'top 78%',
      end: 'top 42%',

      scrub: 0.6,

      invalidateOnRefresh: true,

      // DEBUG:
      // markers: true,
    },
  });


  card01Timeline.to(card01, {
    x: 0,
    y: 0,

    opacity: 1,

    scale: 1,

    filter: 'blur(0px)',

    duration: 1,

    ease: 'power2.out',
  });


  /* =========================================================
     FLOW 01 -> 02
     ========================================================= */

  const flow01Timeline = createFlowTimeline({
    sectionElement,

    flowId: '01-02',

    destinationCard: card02,

    scrollTriggerId: 'services-flow-01-02',
  });


  /* =========================================================
     FLOW 02 -> 03
     ========================================================= */

  const flow02Timeline = createFlowTimeline({
    sectionElement,

    flowId: '02-03',

    destinationCard: card03,

    scrollTriggerId: 'services-flow-02-03',
  });


  /* =========================================================
     REFRESH
     ========================================================= */

  let refreshTimer = null;
  let refreshFrame = null;


  const refreshScrollTriggers = () => {
    refreshFrame = requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
    });
  };


  /*
   * Primeiro refresh depois do primeiro layout.
   */
  refreshScrollTriggers();


  /*
   * Segundo refresh depois de fontes / imagens / canvas
   * terem tido tempo para estabilizar o layout.
   */
  refreshTimer = window.setTimeout(() => {
    ScrollTrigger.refresh(true);
  }, 500);


  /*
   * Quando a página terminar de carregar completamente,
   * recalculamos novamente.
   */
  const handleWindowLoad = () => {
    ScrollTrigger.refresh(true);
  };


  window.addEventListener(
    'load',
    handleWindowLoad
  );


  /* =========================================================
     RESIZE
     ========================================================= */

  let resizeTimer = null;


  const handleResize = () => {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }

    resizeTimer = window.setTimeout(() => {
      ScrollTrigger.refresh(true);
    }, 150);
  };


  window.addEventListener(
    'resize',
    handleResize
  );


  /* =========================================================
     CLEANUP
     ========================================================= */

  return {
    kill() {
      window.removeEventListener(
        'load',
        handleWindowLoad
      );

      window.removeEventListener(
        'resize',
        handleResize
      );


      if (refreshFrame) {
        cancelAnimationFrame(refreshFrame);
      }


      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }


      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }


      card01Timeline.scrollTrigger?.kill();
      card01Timeline.kill();


      if (flow01Timeline) {
        flow01Timeline.scrollTrigger?.kill();
        flow01Timeline.kill();
      }


      if (flow02Timeline) {
        flow02Timeline.scrollTrigger?.kill();
        flow02Timeline.kill();
      }


      /*
       * Remove apenas os estilos que este sistema GSAP
       * colocou directamente nos cards.
       */
      gsap.set(
        [card01, card02, card03].filter(Boolean),
        {
          clearProps:
            'transform,opacity,filter',
        }
      );
    },
  };
}