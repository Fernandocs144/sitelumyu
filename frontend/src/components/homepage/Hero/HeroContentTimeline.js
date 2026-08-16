import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HERO_SCROLL_CONFIG } from './HeroTimeline';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function createHeroContentExperience(triggerElement) {
  if (!triggerElement) {
    return null;
  }

  // =====================================================
  // SELEÇÃO DE ELEMENTOS
  // =====================================================
  const eyebrow = triggerElement.querySelector('[data-hero-eyebrow]');
  const headline = triggerElement.querySelector('[data-hero-headline]');
  const description = triggerElement.querySelector('[data-hero-description]');
  const cta = triggerElement.querySelector('[data-hero-cta]');
  const featuresBar = triggerElement.querySelector('[data-hero-features-bar]');
  const socials = triggerElement.querySelector('[data-hero-socials]');
  const media = triggerElement.querySelector('[data-hero-media]');

  const service01 = triggerElement.querySelector('[data-home-service="01"]');
  const service02 = triggerElement.querySelector('[data-home-service="02"]');
  const service03 = triggerElement.querySelector('[data-home-service="03"]');

  const experience = triggerElement.querySelector('[data-home-experience]');
  const experienceLines = triggerElement.querySelectorAll('[data-home-experience-line]');
  const experienceDescription = triggerElement.querySelector('[data-home-experience-description]');

  const aiCreative = triggerElement.querySelector(
  '[data-home-ai-creative]'
);

const isMobile = window.matchMedia(
  '(max-width: 767px)'
).matches;

const aiCreativeLettering = triggerElement.querySelector(
  isMobile
    ? '[data-ai-creative-lettering-mobile]'
    : '[data-ai-creative-lettering-desktop]'
);

const aiCreativeImage = triggerElement.querySelector(
  isMobile
    ? '[data-ai-creative-image-mobile]'
    : '[data-ai-creative-image-desktop]'
);

const aiCreativeTopLabel = triggerElement.querySelector(
  isMobile
    ? '[data-ai-creative-top-label-mobile]'
    : '[data-ai-creative-top-label-desktop]'
);

const aiCreativeBottomLabel = triggerElement.querySelector(
  isMobile
    ? '[data-ai-creative-bottom-label-mobile]'
    : '[data-ai-creative-bottom-label-desktop]'
);

const aiCreativeDescription = triggerElement.querySelector(
  isMobile
    ? '[data-ai-creative-description-mobile]'
    : '[data-ai-creative-description-desktop]'
);

  const testimonials = triggerElement.querySelector('[data-home-testimonials]');
  const testimonialsHeading = triggerElement.querySelector('[data-testimonials-heading]');
  const testimonialCards = triggerElement.querySelectorAll('[data-testimonial-card]');

  const positioning = triggerElement.querySelector('[data-home-positioning]');
  const positioningIntro = triggerElement.querySelector('[data-positioning-intro]');
  const positioningLine = triggerElement.querySelector('[data-positioning-line]');
  const positioningMainLines = triggerElement.querySelectorAll('[data-positioning-main-line]');
  const positioningCaption = triggerElement.querySelector('[data-positioning-caption]');

  const contact = triggerElement.querySelector('[data-home-contact]');
  const contactHeading = triggerElement.querySelector('[data-contact-heading]');
  const contactTitleLines = triggerElement.querySelectorAll('[data-contact-title-line]');
  const contactForm = triggerElement.querySelector('[data-contact-form]');

  // =====================================================
  // TIMELINE PRINCIPAL
  // =====================================================
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      start: HERO_SCROLL_CONFIG.START,
      end: `+=${HERO_SCROLL_CONFIG.TOTAL_SCROLL_DISTANCE}%`,
      scrub: HERO_SCROLL_CONFIG.SCRUB,
    },
  });

  // Sociais e Zoom de Fundo
  if (socials) timeline.set(socials, { opacity: 1 }, 0);
  if (media) timeline.to(media, { scale: 1.04, duration: 60, ease: 'none' }, 4);

  // -----------------------------------------------------
  // 00 → 12: SAÍDA DO HERO INICIAL
  // -----------------------------------------------------
  timeline.to([description, cta].filter(Boolean), {
    opacity: 0,
    y: -35,
    duration: 6,
    ease: 'none',
  }, 4);

  timeline.to([eyebrow, headline].filter(Boolean), {
    opacity: 0,
    y: -45,
    duration: 6,
    ease: 'none',
  }, 5);

  if (featuresBar) {
    timeline.to(featuresBar, {
      opacity: 0,
      y: 45,
      duration: 6,
      ease: 'none',
    }, 6);
  }

  // -----------------------------------------------------
  // 10 → 32: 01 — PREMIUM WEBSITES
  // -----------------------------------------------------
  if (service01) {
    timeline.fromTo(service01,
      { opacity: 0, y: 140 },
      { opacity: 1, y: 20, duration: 8, ease: 'none' },
      10
    );
    timeline.to(service01, { y: -20, duration: 6, ease: 'none' }, 18);
    timeline.to(service01, { opacity: 0, y: -140, duration: 8, ease: 'none' }, 24);
  }

  // -----------------------------------------------------
  // 28 → 50: 02 — AUTOMATION
  // -----------------------------------------------------
  if (service02) {
    timeline.fromTo(service02,
      { opacity: 0, y: 140 },
      { opacity: 1, y: 20, duration: 8, ease: 'none' },
      28
    );
    timeline.to(service02, { y: -20, duration: 6, ease: 'none' }, 36);
    timeline.to(service02, { opacity: 0, y: -140, duration: 8, ease: 'none' }, 42);
  }

  // -----------------------------------------------------
  // 46 → 68: 03 — ARTIFICIAL INTELLIGENCE
  // -----------------------------------------------------
  if (service03) {
    timeline.fromTo(service03,
      { opacity: 0, y: 140 },
      { opacity: 1, y: 20, duration: 8, ease: 'none' },
      46
    );
    timeline.to(service03, { y: -20, duration: 6, ease: 'none' }, 54);
    timeline.to(service03, { opacity: 0, y: -140, duration: 8, ease: 'none' }, 60);
  }

  // -----------------------------------------------------
  // 66 → 96: EDITORIAL EXPERIENCE (Com máscaras yPercent originais)
  // -----------------------------------------------------
  if (experience) {
    timeline.set(experience, { opacity: 1 }, 66);

    if (experienceLines.length) {
      timeline.fromTo(experienceLines,
        { yPercent: 115 },
        { yPercent: 0, duration: 8, stagger: 1.2, ease: 'none' },
        66
      );
    }

    if (experienceDescription) {
      timeline.fromTo(experienceDescription,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 7, ease: 'none' },
        70
      );
    }

    timeline.fromTo(experience,
      { y: 80 },
      { y: -30, duration: 16, ease: 'none' },
      66
    );

    timeline.to(experience, {
      opacity: 0,
      y: -150,
      duration: 8,
      ease: 'none',
    }, 88);
  }

  // -----------------------------------------------------
  // 94 → 128: AI CREATIVE (Lettering sobe antes da imagem)
  // -----------------------------------------------------
  if (aiCreative) {
    timeline.set(aiCreative, { opacity: 1 }, 94);

    if (aiCreativeLettering) {
      timeline.fromTo(aiCreativeLettering,
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        94
      );
    }

    if (aiCreativeImage) {
      timeline.fromTo(aiCreativeImage,
        { opacity: 0, y: 120, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 9, ease: 'none' },
        104
      );
    }

    const labels = [aiCreativeTopLabel, aiCreativeBottomLabel].filter(Boolean);
    if (labels.length) {
      timeline.fromTo(labels,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 6, stagger: 1, ease: 'none' },
        100
      );
    }

    if (aiCreativeDescription) {
      timeline.fromTo(aiCreativeDescription,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 7, ease: 'none' },
        102
      );
    }

    timeline.to(aiCreative, {
      y: -50,
      duration: 16,
      ease: 'none',
    }, 104);

    timeline.to(aiCreative, {
      opacity: 0,
      y: -150,
      duration: 8,
      ease: 'none',
    }, 120);
  }

  // -----------------------------------------------------
  // 126 → 162: CLIENT TESTIMONIALS (Cascata progressiva original)
  // -----------------------------------------------------
  if (testimonials) {
    timeline.set(testimonials, { opacity: 1 }, 126);

    if (testimonialsHeading) {
      timeline.fromTo(testimonialsHeading,
        { opacity: 0, y: 80 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        126
      );
    }

    // Entrada progressiva escalonada por cartão
    if (testimonialCards[0]) {
      timeline.fromTo(testimonialCards[0],
        { opacity: 0, y: 80 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        130
      );
    }

    if (testimonialCards[1]) {
      timeline.fromTo(testimonialCards[1],
        { opacity: 0, y: 120 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        133
      );
    }

    if (testimonialCards[2]) {
      timeline.fromTo(testimonialCards[2],
        { opacity: 0, y: 160 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        136
      );
    }

    timeline.to(testimonials, {
      y: -60,
      duration: 16,
      ease: 'none',
    }, 138);

    timeline.to(testimonials, {
      opacity: 0,
      y: -160,
      duration: 8,
      ease: 'none',
    }, 154);
  }

  // -----------------------------------------------------
  // 160 → 198: LUMYO POSITIONING (Máscaras yPercent / cascata)
  // -----------------------------------------------------
  if (positioning) {
    timeline.set(positioning, { opacity: 1 }, 160);

    if (positioningIntro) {
      timeline.fromTo(positioningIntro,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 6, ease: 'none' },
        160
      );
    }

    if (positioningLine) {
      timeline.fromTo(positioningLine,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        162
      );
    }

    if (positioningMainLines[0]) {
      timeline.fromTo(positioningMainLines[0],
        { opacity: 0, y: 90 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        165
      );
    }

    if (positioningMainLines[1]) {
      timeline.fromTo(positioningMainLines[1],
        { opacity: 0, y: 110 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        168
      );
    }

    if (positioningCaption) {
      timeline.fromTo(positioningCaption,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        171
      );
    }

    timeline.to(positioning, {
      y: -50,
      duration: 16,
      ease: 'none',
    }, 174);

    timeline.to(positioning, {
      opacity: 0,
      y: -160,
      duration: 8,
      ease: 'none',
    }, 190);
  }

  // -----------------------------------------------------
  // 196 → 240: FINAL CONTACT COM BUFFER PARA O FOOTER
  // -----------------------------------------------------
  if (contact) {
    timeline.set(contact, { opacity: 1 }, 196);

    if (contactHeading) {
      timeline.fromTo(contactHeading,
        { opacity: 0, y: 80 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        196
      );
    }

    if (contactTitleLines[0]) {
      timeline.fromTo(contactTitleLines[0],
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        198
      );
    }

    if (contactTitleLines[1]) {
      timeline.fromTo(contactTitleLines[1],
        { opacity: 0, y: 120 },
        { opacity: 1, y: 0, duration: 8, ease: 'none' },
        201
      );
    }

    if (contactForm) {
      timeline.fromTo(contactForm,
        { opacity: 0, y: 80 },
        { opacity: 1, y: 0, duration: 10, ease: 'none' },
        204
      );
    }

    // Leitura do formulário
    timeline.to(contact, {
      y: -40,
      duration: 14,
      ease: 'none',
    }, 212);

    // Saída completa ANTES do fim do pin para o Footer entrar limpo
    timeline.to(contact, {
      opacity: 0,
      y: -150,
      duration: 10,
      ease: 'none',
    }, 226);
  }

  // Buffer final: garante que a cena está 100% limpa antes de libertar o scroll
  timeline.to({}, { duration: 6 }, 236);

  return timeline;
}