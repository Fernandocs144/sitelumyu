import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useLang } from '../i18n';
import ParticleField from '../components/ParticleField';
import SEO from '../components/seo/SEO';

export default function CaseStudies() {
  const { t } = useLang();

  const [activeCase, setActiveCase] = useState(null);

  const toggleCase = (id) => {
    setActiveCase((current) =>
      current === id ? null : id
    );
  };

  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-32 pb-24 md:pt-40 md:pb-28">
      <SEO
        title="Casos de Estudo"
        titleEn="Case Studies"
        description="Conhece projetos e soluções digitais desenvolvidos pela Lumyo e descobre como combinamos estratégia, design, tecnologia, automação e crescimento."
        descriptionEn="Explore digital projects and solutions developed by Lumyo and discover how we combine strategy, design, technology, automation and growth."
        path="/case-studies"
      />

      <ParticleField count={40} />

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="max-w-5xl">
          <p className="font-head text-xs tracking-mega text-magenta md:text-sm">
            {t.cases.eyebrow}
          </p>

          <h1 className="mt-6 max-w-5xl font-head text-4xl font-bold leading-[1.08] text-white md:text-6xl lg:text-7xl">
            {t.cases.heading}
          </h1>

          <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-white/55 md:text-xl">
            {t.cases.intro}
          </p>
        </section>

        {/* =====================================================
            CASE STUDIES GRID
        ===================================================== */}

        <section className="mt-20 md:mt-28">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {t.cases.items.map((caseItem, index) => {
              const isOpen = activeCase === caseItem.id;

              return (
                <motion.article
                  key={caseItem.id}
                  layout
                  initial={{
                    opacity: 0,
                    y: 35,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.12,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.06,
                  }}
                  className={`
                    group relative overflow-hidden rounded-[28px]
                    border transition-colors duration-500
                    ${
                      isOpen
                        ? 'border-magenta/40 bg-white/[0.055] lg:col-span-2'
                        : 'border-white/10 bg-white/[0.035] hover:border-white/20'
                    }
                  `}
                >

                  {/* =================================================
                      CARD HEADER / IMAGE
                  ================================================= */}

                  <button
                    type="button"
                    onClick={() => toggleCase(caseItem.id)}
                    aria-expanded={isOpen}
                    className="block w-full cursor-pointer text-left"
                  >
                    <div
                      className={`
                        relative overflow-hidden
                        transition-all duration-700
                        ${
                          isOpen
                            ? 'h-[300px] md:h-[420px]'
                            : 'h-[260px] md:h-[330px]'
                        }
                      `}
                    >
                      <img
                        src={caseItem.image}
                        alt={caseItem.title}
                        className={`
                          h-full w-full object-cover
                          transition-all duration-[1200ms]
                          ${
                            isOpen
                              ? 'scale-[1.02] opacity-90'
                              : 'opacity-70 group-hover:scale-[1.035] group-hover:opacity-85'
                          }
                        `}
                      />

                      {/* DARK GRADIENT */}

                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

                      {/* NUMBER */}

                      <div className="absolute left-6 top-6 md:left-8 md:top-8">
                        <span className="font-head text-[10px] tracking-[0.3em] text-magenta md:text-xs">
                          {caseItem.number}
                        </span>
                      </div>

                      {/* OPEN / CLOSE */}

                      <div className="absolute right-6 top-6 md:right-8 md:top-8">
                        <div
                          className={`
                            flex h-11 w-11 items-center justify-center
                            rounded-full border backdrop-blur-md
                            transition-all duration-300
                            ${
                              isOpen
                                ? 'border-magenta bg-magenta text-white'
                                : 'border-white/15 bg-black/20 text-white'
                            }
                          `}
                        >
                          {isOpen ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* IMAGE BOTTOM LABEL */}

                      <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8">
                        <span className="font-head text-[10px] tracking-[0.3em] text-magenta md:text-xs">
                          {caseItem.tag}
                        </span>
                      </div>
                    </div>

                    {/* =================================================
                        BASIC INFORMATION
                    ================================================= */}

                    <div className="p-7 md:p-9 lg:p-10">
                      <div className="flex items-start justify-between gap-6">

                        <div className="max-w-2xl">
                          <h2 className="font-head text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl lg:text-4xl">
                            {caseItem.title}
                          </h2>

                          <p className="mt-4 font-display text-lg leading-snug text-hotpink glow-soft md:text-xl lg:text-2xl">
                            {caseItem.result}
                          </p>

                          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-white/55 md:text-lg">
                            {caseItem.body}
                          </p>
                        </div>

                      </div>

                      {/* CAPABILITIES PREVIEW */}

                      <div className="mt-7 flex flex-wrap gap-2">
                        {caseItem.capabilities
                          .slice(0, 4)
                          .map((capability) => (
                            <span
                              key={capability}
                              className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 font-head text-[9px] tracking-[0.15em] text-white/50 md:text-[10px]"
                            >
                              {capability}
                            </span>
                          ))}

                        {caseItem.capabilities.length > 4 && (
                          <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 font-head text-[9px] tracking-[0.15em] text-white/35 md:text-[10px]">
                            +{caseItem.capabilities.length - 4}
                          </span>
                        )}
                      </div>

                      {/* VIEW DETAILS */}

                      <div className="mt-8 flex items-center gap-3">
                        <span className="font-head text-[10px] tracking-[0.25em] text-white/60 transition-colors duration-300 group-hover:text-white md:text-xs">
                          {isOpen
                            ? t.cases.closeCase
                            : t.cases.openCase}
                        </span>

                        <ChevronDown
                          className={`
                            h-4 w-4 text-magenta
                            transition-transform duration-500
                            ${
                              isOpen
                                ? 'rotate-180'
                                : ''
                            }
                          `}
                        />
                      </div>
                    </div>
                  </button>

                  {/* =================================================
                      EXPANDED CASE
                  ================================================= */}

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="details"
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          height: {
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          },
                          opacity: {
                            duration: 0.35,
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10">

                          {/* PROBLEM + SOLUTION */}

                          <div className="grid grid-cols-1 lg:grid-cols-2">

                            {/* PROBLEM */}

                            <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r lg:p-12">
                              <p className="font-head text-[10px] tracking-[0.3em] text-magenta md:text-xs">
                                {caseItem.problemTitle}
                              </p>

                              <p className="mt-6 font-body text-base leading-[1.8] text-white/60 md:text-lg">
                                {caseItem.problem}
                              </p>
                            </div>

                            {/* SOLUTION */}

                            <div className="p-7 md:p-10 lg:p-12">
                              <p className="font-head text-[10px] tracking-[0.3em] text-magenta md:text-xs">
                                {caseItem.solutionTitle}
                              </p>

                              <p className="mt-6 font-body text-base leading-[1.8] text-white/60 md:text-lg">
                                {caseItem.solution}
                              </p>
                            </div>
                          </div>

                          {/* CLINIC FEATURES — ONLY WHEN AVAILABLE */}

                          {caseItem.features &&
                            caseItem.features.length > 0 && (
                              <div className="border-t border-white/10 p-7 md:p-10 lg:p-12">
                                <div className="grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2">

                                  {caseItem.features.map(
                                    (feature, featureIndex) => (
                                      <div
                                        key={feature}
                                        className="flex items-start gap-4"
                                      >
                                        <span className="mt-[2px] font-head text-[10px] tracking-[0.2em] text-magenta">
                                          {String(
                                            featureIndex + 1
                                          ).padStart(2, '0')}
                                        </span>

                                        <p className="font-body text-sm leading-relaxed text-white/60 md:text-base">
                                          {feature}
                                        </p>
                                      </div>
                                    )
                                  )}

                                </div>
                              </div>
                            )}

                          {/* ALL CAPABILITIES */}

                          <div className="border-t border-white/10 p-7 md:p-10 lg:p-12">
                            <div className="flex flex-wrap gap-2">
                              {caseItem.capabilities.map(
                                (capability) => (
                                  <span
                                    key={capability}
                                    className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 font-head text-[9px] tracking-[0.15em] text-white/55 md:text-[10px]"
                                  >
                                    {capability}
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* CASE CTA */}

                          <div className="border-t border-white/10 p-7 md:p-10 lg:p-12">
                            <Link
                              to={`/contact?service=${encodeURIComponent(caseItem.service)}`}
                              className="inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-magenta to-violet px-7 py-4 pill-btn font-head text-[10px] tracking-[0.22em] text-white md:px-8 md:text-xs"
                            >
                              {caseItem.cta}

                              <ArrowUpRight className="h-4 w-4 text-white" />
                            </Link>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.article>
              );
            })}

          </div>
        </section>

        {/* =====================================================
            GLOBAL CTA
        ===================================================== */}

        <section className="mt-24 text-center md:mt-32">
          <Link
            to="/contact"
            data-testid="cases-cta"
            className="inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-magenta to-violet px-8 py-4 pill-btn font-head text-xs tracking-[0.25em] text-white md:text-sm"
          >
            {t.cases.cta}

            <ArrowUpRight className="h-4 w-4 text-white" />
          </Link>
        </section>

      </div>
    </div>
  );
}