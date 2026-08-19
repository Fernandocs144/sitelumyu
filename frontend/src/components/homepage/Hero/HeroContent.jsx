import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';

import { useLang } from '../../../i18n';
import HeroFeaturesBar from './HeroFeaturesBar';
import HeroSocials from './HeroSocials';

export default function HeroContent() {
  const { t } = useLang();
  const h = t.home;
  const [contactStatus, setContactStatus] = useState('idle');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (contactStatus === 'sending') {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      service: formData.get('service'),
      message: formData.get('message'),
      website: formData.get('website'),
    };

    setContactStatus('sending');
    setContactMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Contact request failed');
      }

      form.reset();

      setContactStatus('success');
      setContactMessage(h.contactScene.successMessage);
    } catch (error) {
      console.error('Contact form error:', error);

      setContactStatus('error');
      setContactMessage(h.contactScene.errorMessage);
    }
  };

  return (
    <div
      data-hero-content
      className="
        relative z-20 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col justify-between
        px-4 pt-20 pb-6
        sm:px-6 sm:pt-24
        md:px-12 md:pt-28 md:pb-12
      "
    >
      <HeroSocials />

      {/* ===================================================== */}
      {/* EDITORIAL SERVICES                                    */}
      {/* ===================================================== */}

      <div data-home-editorial className="pointer-events-none absolute inset-0">
        {/* 01 — PREMIUM WEBSITES */}
        <div data-home-service="01" className="absolute inset-0 flex items-center opacity-0">
          <div className="mx-auto w-full max-w-[760px] px-6 sm:px-8 md:ml-[8vw] md:px-0">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="font-head text-xs tracking-[0.25em] text-magenta md:text-sm md:tracking-[0.3em]">
                {h.servicePremium.number}
              </span>
              <span className="h-px w-10 bg-magenta/70 md:w-14" />
            </div>

            <h2
              className="mt-4 font-display text-3xl leading-[0.95] text-white sm:text-5xl md:mt-6 md:text-[clamp(3.5rem,7vw,7rem)] md:leading-[0.9]"
            >
              {h.servicePremium.titleLine1}
              <span className="block text-outline-glow glow-pink">
                {h.servicePremium.titleLine2}
              </span>
            </h2>

            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-white/60 sm:text-base md:mt-7 md:text-lg">
              {h.servicePremium.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* 02 — AUTOMATION */}
        <div data-home-service="02" className="absolute inset-0 flex items-center justify-end opacity-0">
          <div className="mx-auto w-full max-w-[650px] px-6 text-right sm:px-8 md:mr-[9vw] md:px-0">
            <div className="flex items-center justify-end gap-3 md:gap-4">
              <span className="h-px w-10 bg-magenta/70 md:w-14" />
              <span className="font-head text-xs tracking-[0.25em] text-magenta md:text-sm md:tracking-[0.3em]">
                {h.serviceAutomation.number}
              </span>
            </div>

            <h2
              className="mt-4 font-display text-3xl leading-[0.95] text-white sm:text-5xl md:mt-6 md:text-[clamp(3.5rem,7vw,7rem)] md:leading-[0.9]"
            >
              {h.serviceAutomation.titleLine1}
              <span className="block text-outline-glow glow-pink">
                {h.serviceAutomation.titleLine2}
              </span>
            </h2>

            <p className="mt-4 ml-auto max-w-sm font-body text-sm leading-relaxed text-white/60 sm:text-base md:mt-7 md:text-lg">
              {h.serviceAutomation.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* 03 — ARTIFICIAL INTELLIGENCE */}
        <div data-home-service="03" className="absolute inset-0 flex items-center md:items-end opacity-0">
          <div className="mx-auto w-full max-w-[900px] px-6 sm:px-8 md:mb-[12vh] md:ml-[12vw] md:px-0">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="font-head text-xs tracking-[0.25em] text-magenta md:text-sm md:tracking-[0.3em]">
                {h.serviceAI.number}
              </span>
              <span className="h-px w-10 bg-magenta/70 md:w-14" />
            </div>

            <h2
              className="mt-4 font-display text-3xl leading-[0.95] text-white sm:text-5xl md:mt-5 md:text-[clamp(3rem,6.2vw,6.5rem)] md:leading-[0.9]"
            >
              {h.serviceAI.titleLine1}
              <span className="block text-outline-glow glow-pink">
                {h.serviceAI.titleLine2}
              </span>
            </h2>

            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-white/60 sm:text-base md:mt-6 md:text-lg">
              {h.serviceAI.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* ===================================================== */}
        {/* EDITORIAL EXPERIENCE                                  */}
        {/* ===================================================== */}

        <div data-home-experience className="absolute inset-0 opacity-0">
          <div className="absolute inset-x-0 bottom-[6vh] px-5 sm:px-8 md:bottom-[10vh] md:px-[8vw]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
              {/* HEADLINE */}
              <div className="md:col-span-9">
                <div className="overflow-hidden">
                  <div
                    data-home-experience-line
                    className="
  font-display
  text-2xl
  leading-[0.95]
  tracking-[0.01em]
  text-white

  sm:text-4xl

  md:whitespace-nowrap
  md:text-[clamp(2rem,4vw,3.5rem)]
  md:leading-[1.02]
"
                  >
                    {h.editorialExperience.titleLine1}
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div
                    data-home-experience-line
                    className="
  font-display
  text-2xl
  leading-[0.95]
  tracking-[0.01em]
  text-white

  sm:text-4xl

  md:whitespace-nowrap
  md:text-[clamp(2rem,4vw,4rem)]
  md:leading-[1.02]
"
                  >
                    {h.editorialExperience.titleLine2}
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div
                    data-home-experience-line
                   className="
  font-display
  text-2xl
  leading-[0.95]
  tracking-[0.01em]
  text-outline-glow
  glow-pink

  sm:text-4xl

  md:whitespace-nowrap
  md:text-[clamp(2rem,4vw,3.8rem)]
  md:leading-[1.02]
"
                  >
                    {h.editorialExperience.titleLine3}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="pb-2 md:col-span-4 md:col-start-9 md:pb-0 lg:col-span-3 lg:col-start-10">
                <div className="mb-3 flex items-center gap-3 md:mb-5 md:gap-4">
                  <span className="h-px w-8 bg-magenta/70 md:w-10" />
                  <span className="font-head text-[9px] tracking-[0.25em] text-magenta md:text-[10px] md:tracking-[0.3em]">
                    LUMYO
                  </span>
                </div>

                <p
                  data-home-experience-description
                  className="max-w-xs font-body text-xs leading-relaxed text-white/80 sm:text-sm md:text-base"
                >
                  {h.editorialExperience.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* AI CREATIVE                                           */}
        {/* ===================================================== */}

        <div data-home-ai-creative className="pointer-events-none absolute inset-0 opacity-0">
          {/* MOBILE LAYOUT */}
          <div className="relative flex h-full w-full flex-col items-center justify-center px-6 md:hidden">
            {/* Top Label */}
            <div data-ai-creative-top-label-mobile className="mb-3 flex items-center gap-2">
              <span className="text-magenta font-bold">+</span>
              <span className="font-head text-[9px] tracking-[0.25em] text-white/70">
                {h.aiCreative.eyebrowTop}
              </span>
            </div>

            {/* Imagem Central com os Textos Enquadrados */}
            <div className="relative my-2 flex w-full max-w-[280px] flex-col items-center">
              {/* Título Superior Mobile */}
              <div
                data-ai-creative-lettering-mobile
                className="w-full text-center font-display text-4xl uppercase leading-none tracking-tight text-white mb-2"
              >
                {h.aiCreative.titleLeft}
              </div>

              {/* Imagem com Glass Frame */}
              <div
                data-ai-creative-image-mobile
                className="w-[52vw] max-w-[210px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              >
                <img
                  src="/images/home/ai-creative.webp"
                  alt=""
                  aria-hidden="true"
                  className="block aspect-[4/5] w-full object-cover object-center"
                />
              </div>

              {/* Título Inferior Mobile */}
              <div className="w-full text-center font-display text-4xl uppercase leading-none tracking-tight text-white mt-2">
                {h.aiCreative.titleRight}
              </div>
            </div>

            {/* Bottom Label */}
            <div data-ai-creative-bottom-label-mobile className="mt-3 flex items-center gap-2">
              <span className="text-magenta font-bold">+</span>
              <span className="font-head text-[9px] tracking-[0.25em] text-white/70">
                {h.aiCreative.eyebrowBottom}
              </span>
            </div>

            {/* Descrição Mobile */}
            <div
              data-ai-creative-description-mobile
              className="mt-4 max-w-[290px] rounded-xl border border-white/10 bg-black/40 p-3.5 text-center backdrop-blur-md"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-magenta/70" />
                <span className="font-head text-[8px] tracking-[0.25em] text-magenta">
                  LUMYO
                </span>
                <span className="h-px w-6 bg-magenta/70" />
              </div>

              <p className="font-body text-xs leading-relaxed text-white/75">
                {h.aiCreative.description}
              </p>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= md) */}
          <div className="absolute inset-0 hidden md:block">
            {/* LABEL SUPERIOR */}
            <div
              data-ai-creative-top-label-desktop
              className="absolute left-[29%] top-[19%] z-30 flex items-center gap-3"
            >
              <span className="text-magenta">+</span>
              <span className="font-head text-[10px] tracking-[0.3em] text-white/55">
                {h.aiCreative.eyebrowTop}
              </span>
            </div>

            {/* LETTERING */}
            <div
              data-ai-creative-lettering-desktop
              className="absolute left-1/2 top-[45%] z-10 w-full -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="mx-auto grid w-[92%] grid-cols-[1fr_auto_1fr] items-center font-display uppercase leading-[0.85] tracking-[-0.025em] text-white"
                style={{ fontSize: 'clamp(4rem, 7vw, 7.5rem)' }}
              >
                <span className="justify-self-end pr-[3vw]">
                  {h.aiCreative.titleLeft}
                </span>
                <span className="w-32 lg:w-44" />
                <span className="justify-self-start pl-[3vw]">
                  {h.aiCreative.titleRight}
                </span>
              </div>
            </div>

            {/* IMAGEM CENTRAL */}
            <div
              data-ai-creative-image-desktop
              className="absolute left-1/2 top-[47%] z-20 w-[30vw] min-w-[30px] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
            >
              <img
                src="/images/home/ai-creative.webp"
                alt=""
                aria-hidden="true"
                className="block aspect-[4/5] w-full object-cover object-center"
              />
            </div>

            {/* LABEL INFERIOR */}
            <div
              data-ai-creative-bottom-label-desktop
              className="absolute bottom-[17%] left-[31%] z-30 flex items-center gap-3"
            >
              <span className="text-magenta">+</span>
              <span className="font-head text-[10px] tracking-[0.3em] text-white/55">
                {h.aiCreative.eyebrowBottom}
              </span>
            </div>

            {/* DESCRIÇÃO */}
            <div
              data-ai-creative-description-desktop
              className="absolute bottom-[18%] right-[9%] z-30 max-w-[260px]"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-9 bg-magenta/70" />
                <span className="font-head text-[9px] tracking-[0.3em] text-magenta">
                  LUMYO
                </span>
              </div>

              <p className="font-body text-sm leading-relaxed text-white/55">
                {h.aiCreative.description}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* CLIENT TESTIMONIALS                                   */}
        {/* ===================================================== */}

        <div
  data-home-testimonials
  className="
    absolute inset-0 opacity-0
    overflow-y-auto overflow-x-hidden
    md:overflow-visible
  "
>
          <div
  className="
    relative
    w-full
    px-4
    pt-[10vh]
    pb-24

    sm:px-6

    md:absolute
    md:inset-x-0
    md:top-[15vh]
    md:p-0
    md:px-[7vw]
  "
>
            <div data-testimonials-heading className="mb-4 md:mb-[8vh]">
              <div className="mb-3 flex items-center gap-3 md:mb-5 md:gap-3">
                <span className="font-head text-[9px] tracking-[0.25em] text-magenta md:text-[10px] md:tracking-[0.3em]">
                  LUMYO
                </span>
                <span className="h-px w-8 bg-magenta/70 md:w-12" />
              </div>

              <h2
                className="max-w-[1100px] font-display text-3xl uppercase leading-[0.92] tracking-[-0.02em] text-white sm:text-5xl md:text-[clamp(3rem,5.6vw,6rem)]"
              >
                {h.testimonials.titleLine1}
                <span className="block text-outline-glow glow-pink">
                  {h.testimonials.titleLine2}
                </span>
              </h2>
            </div>

            <div
              data-testimonials-grid
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 pb-12 md:pb-0"
            >
              {h.testimonials.items.map((item, idx) => (
                <article
                  key={idx}
                  data-testimonial-card
                  className="
  relative flex flex-col justify-between
  min-h-[185px]
  sm:min-h-[220px]
  md:min-h-[330px]

  overflow-hidden
  rounded-2xl
  md:rounded-[1.5rem]

  border border-white/[0.10]
  bg-black/[0.35]
  md:bg-black/[0.22]

  p-5
  md:px-8
  md:py-8

  shadow-[0_25px_80px_rgba(0,0,0,0.14)]
  backdrop-blur-[5px]
"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="font-head text-[9px] tracking-[0.25em] text-magenta md:text-[10px] md:tracking-[0.3em]">
                        0{idx + 1}
                      </span>
                      <span className="font-display text-2xl leading-none text-white/15 md:text-3xl" aria-hidden="true">
                        “
                      </span>
                    </div>

                    {/* MOBILE */}
<p
  className="
    mt-4
    font-body
    text-xs
    leading-[1.6]
    text-white/80

    md:hidden
  "
>
  “{item.shortQuote || item.quote}”
</p>

{/* DESKTOP */}
<p
  className="
    mt-7
    hidden
    font-body
    text-[15px]
    leading-[1.75]
    text-white/80

    md:block
  "
>
  “{item.quote}”
</p>
                  </div>

                  <div className="relative z-10 mt-6 border-t border-white/[0.10] pt-3 md:mt-10 md:pt-5">
                    <div className="font-head text-[10px] tracking-[0.08em] text-white md:text-[12px]">
                      {item.name}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* LUMYO POSITIONING                                     */}
        {/* ===================================================== */}

        <div data-home-positioning className="absolute inset-0 opacity-0">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 sm:px-8 md:px-[8vw]">
            <div data-positioning-intro className="mb-4 flex items-center gap-3 md:mb-[5vh] md:gap-4">
              <span className="h-px w-8 bg-magenta/70 md:w-12" />
              <span className="font-head text-[9px] tracking-[0.25em] text-magenta md:text-[10px] md:tracking-[0.3em]">
                {h.positioning.brand}
              </span>
              <span className="font-head text-[9px] tracking-[0.2em] text-white/40 md:text-[10px] md:tracking-[0.25em]">
                {h.positioning.eyebrow}
              </span>
            </div>

            <div
              data-positioning-line
              className="mb-2 max-w-[900px] font-display text-xl uppercase leading-[0.95] tracking-[-0.015em] text-white/45 sm:text-2xl md:mb-[2vh] md:text-[clamp(2rem,3.2vw,3.6rem)]"
            >
              {h.positioning.line1}
            </div>

            <div
              className="max-w-[1500px] font-display text-3xl uppercase leading-[0.88] tracking-[-0.025em] sm:text-5xl md:text-[clamp(4rem,7.4vw,8.5rem)]"
            >
              <div className="overflow-hidden">
                <div data-positioning-main-line className="text-white">
                  {h.positioning.line2}
                </div>
              </div>

              <div className="overflow-hidden">
                <div data-positioning-main-line className="text-outline-glow glow-pink">
                  {h.positioning.line3}
                </div>
              </div>
            </div>

            <div
              data-positioning-caption
              className="mt-4 max-w-[330px] border-t border-white/15 pt-3 md:ml-auto md:mt-[5vh] md:pt-5"
            >
              <p className="font-body text-xs leading-relaxed text-white/55 md:text-sm">
                {h.positioning.description}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* FINAL CONTACT / CTA                                   */}
        {/* ===================================================== */}

        <div data-home-contact className="pointer-events-auto absolute inset-0 opacity-0 overflow-y-auto md:overflow-visible">
          <div className="relative min-h-full w-full px-4 pt-28 pb-16 sm:px-6 md:absolute md:inset-0 md:p-0 md:px-[8vw]">
            <div
              data-contact-heading
              className="mb-6 max-w-[1050px] md:absolute md:left-[8vw] md:top-[12vh] md:mb-0"
            >
              <div className="mb-3 flex items-center gap-3 md:mb-6 md:gap-4">
                <span className="h-px w-8 bg-magenta/70 md:w-12" />
                <span className="font-head text-[9px] tracking-[0.25em] text-magenta md:text-[10px] md:tracking-[0.3em]">
                  {h.contactScene.eyebrow}
                </span>
              </div>

              <h2
                className="font-display text-3xl uppercase leading-[0.88] tracking-[-0.025em] text-white sm:text-5xl md:text-[clamp(3.5rem,6vw,7rem)]"
              >
                <span data-contact-title-line className="block">
                  {h.contactScene.titleLine1}
                </span>
                <span data-contact-title-line className="block text-outline-glow glow-pink">
                  {h.contactScene.titleLine2}
                </span>
              </h2>
            </div>

            <div
              data-contact-form
              className="
                relative grid grid-cols-1 gap-6 rounded-2xl border border-white/[0.10]
                bg-black/80 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.16)] backdrop-blur-md
                sm:p-6
                md:absolute md:bottom-[6vh] md:left-[6vw] md:right-[6vw] md:grid-cols-[0.7fr_1.3fr] md:gap-[5vw] md:rounded-[1.5rem] md:bg-black/[0.20] md:px-10 md:py-8 md:backdrop-blur-[2px]
              "
            >
              <div>
                <p className="max-w-[340px] font-body text-xs leading-relaxed text-white/75 sm:text-sm md:text-base">
                  {h.contactScene.description}
                </p>
              </div>

              <form
                onSubmit={handleContactSubmit}
                className="pointer-events-auto relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 md:gap-x-8 md:gap-y-6"
              >
                {/* Campo Honeypot para Spam */}
                <input
                  type="text"
                  name="website"
                  tabIndex="-1"
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
                />

                {/* NOME */}
                <label className="border-b border-white/40 pb-2 md:pb-3">
                  <span className="mb-1 block font-head text-[8px] tracking-[0.2em] text-white/60 md:mb-2 md:text-[9px] md:tracking-[0.25em]">
                    {h.contactScene.labelName}
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={h.contactScene.placeholderName}
                    className="w-full bg-transparent font-body text-xs text-white outline-none placeholder:text-white/50 sm:text-sm md:placeholder:text-white/70"
                  />
                </label>

                {/* EMAIL */}
                <label className="border-b border-white/30 pb-2 md:pb-3">
                  <span className="mb-1 block font-head text-[8px] tracking-[0.2em] text-white/60 md:mb-2 md:text-[9px] md:tracking-[0.25em]">
                    {h.contactScene.labelEmail}
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder={h.contactScene.placeholderEmail}
                    required
                    className="w-full bg-transparent font-body text-xs text-white outline-none placeholder:text-white/50 sm:text-sm md:placeholder:text-white/70"
                  />
                </label>

                {/* SERVIÇO */}
                <label className="border-b border-white/30 pb-2 md:pb-3">
                  <span className="mb-1 block font-head text-[8px] tracking-[0.2em] text-white/60 md:mb-2 md:text-[9px] md:tracking-[0.25em]">
                    {h.contactScene.labelService}
                  </span>
                  <select
                    name="service"
                    required
                    defaultValue=""
                    className="w-full bg-transparent font-body text-xs text-white/70 outline-none sm:text-sm"
                  >
                    <option value="" disabled className="text-black">
                      {h.contactScene.placeholderService}
                    </option>
                    {h.contactScene.services.map((service) => (
                      <option key={service} value={service} className="text-black">
                        {service}
                      </option>
                    ))}
                  </select>
                </label>

                {/* MENSAGEM */}
                <label className="border-b border-white/30 pb-2 md:pb-3">
                  <span className="mb-1 block font-head text-[8px] tracking-[0.2em] text-white/60 md:mb-2 md:text-[9px] md:tracking-[0.25em]">
                    {h.contactScene.labelMessage}
                  </span>
                  <input
                    type="text"
                    name="message"
                    required
                    placeholder={h.contactScene.placeholderMessage}
                    className="w-full bg-transparent font-body text-xs text-white outline-none placeholder:text-white/50 sm:text-sm md:placeholder:text-white/60"
                  />
                </label>

                {/* SUBMIT / ESTADO */}
                <div className="flex flex-col gap-3 pt-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:pt-3">
                  <div className="min-h-[18px]">
                    {contactMessage && (
                      <p
                        className={`font-body text-xs sm:text-sm ${
                          contactStatus === 'success' ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {contactMessage}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={contactStatus === 'sending'}
                    className="group inline-flex min-h-[46px] w-full sm:w-auto flex-shrink-0 items-center justify-center gap-4 rounded-full bg-[#ff5a1f] px-6 font-head text-[10px] tracking-[0.2em] text-white shadow-[0_12px_35px_rgba(255,90,31,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ff6a33] disabled:cursor-wait disabled:opacity-60 md:min-h-[52px] md:gap-5 md:px-7 md:text-[11px] md:tracking-[0.22em]"
                  >
                    <span>
                      {contactStatus === 'sending' ? h.contactScene.sending : h.contactScene.submit}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 md:h-4 md:w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* HERO PRINCIPAL */}
      <div
        data-hero-main-content
        className="
          relative z-30
          w-full max-w-full pt-2
          sm:max-w-[85vw]
          md:max-w-2xl md:pt-6
        "
      >
        <div data-hero-eyebrow className="flex items-center gap-3 md:gap-4">
          <span className="font-head text-xs tracking-[0.25em] text-magenta md:text-sm md:tracking-[0.3em]">01</span>
          <span className="h-px w-10 bg-magenta/70 md:w-14" />
        </div>

        <h1
          data-hero-headline
          className="
            mt-3 font-display text-3xl leading-[0.92] text-white
            xs:text-4xl
            sm:text-5xl
            md:mt-6 md:text-[clamp(1.8rem,5vw,4.2rem)] md:leading-[1.08]
          "
        >
          <span data-hero-line-1 className="block tracking-[0.04em] md:tracking-[0.08em]">
            {h.heroLine1}
          </span>
          <span
            data-hero-line-2
            className="
              hero-text-sync
              mt-1.5 block
              text-4xl
              leading-[0.88]
              tracking-[0.02em]
              text-outline-glow
              glow-pink
              xs:text-5xl
              sm:text-6xl
              md:mt-2
              md:text-[clamp(3rem,8vw,6.5rem)]
              md:tracking-[0.1em]
            "
          >
            {h.heroLine2}
          </span>
          <span
            data-hero-line-3
            className="
              mt-2 block
              font-head
              text-sm
              tracking-[0.18em]
              glow-magenta-text
              xs:text-base
              sm:text-lg
              md:mt-3
              md:text-[clamp(1.4rem,3vw,2.4rem)]
              md:tracking-mega
            "
          >
            {h.heroLine3}
          </span>
        </h1>

        <p
          data-hero-description
          className="
            mt-4 max-w-[290px]
            font-body text-xs leading-relaxed text-white/65
            xs:max-w-[320px] xs:text-sm
            sm:max-w-sm sm:text-base
            md:mt-6 md:max-w-md md:text-lg md:text-white/60
          "
        >
          {h.heroDesc}
        </p>

        <Link
          to="/contact"
          data-hero-cta
          data-testid="hero-cta"
          className="
            pill-btn mt-5 inline-flex items-center gap-3
            md:mt-8 md:gap-5
          "
        >
          <span className="
            ring-play flex h-9 w-9 items-center justify-center
            rounded-full border border-magenta text-magenta
            md:h-12 md:w-12
          ">
            <Play className="h-4 w-4 fill-magenta md:h-5 md:w-5" />
          </span>
          <span className="
            font-head text-[9px] tracking-[0.18em] text-white
            md:text-xs md:tracking-[0.3em]
          ">
            {t.common.startProject}
          </span>
          <ArrowRight className="h-4 w-4 text-magenta md:h-5 md:w-5" />
        </Link>
      </div>

      <HeroFeaturesBar />
    </div>
  );
}