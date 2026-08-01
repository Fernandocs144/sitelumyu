import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Settings, Sparkles, TrendingUp, Check, ArrowRight } from 'lucide-react';
import { IMAGES } from '../data';
import { useLang } from '../i18n';
import Hero from '../components/homepage/Hero/Hero';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const solutionIcons = [Globe, Settings, Sparkles, TrendingUp];

/* ═══════════════════════════════════════════════════════════════
   SERVICE CARD — Scoped Homepage Glass Card
   ═══════════════════════════════════════════════════════════════ */
function ServiceCard({ number, icon: Icon, title, lines, discover, align = 'left' }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className={`glass-neon relative z-10 w-full max-w-[580px] rounded-2xl p-8 md:p-12 ${
        align === 'right' ? 'ml-auto text-left' : 'mr-auto text-left'
      }`}
      data-testid={`service-card-${number}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-magenta/40 bg-magenta/10 shadow-[0_0_18px_rgba(255,45,120,0.3)]">
          <Icon className="h-6 w-6 text-magenta" strokeWidth={1.4} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">{number}</span>
          <span className="h-px w-10 bg-magenta/60" />
        </div>
      </div>

      <h3 className="mt-6 font-head text-xl font-bold leading-tight tracking-wide text-white md:text-2xl">
        {title}
      </h3>

      <div className="mt-4 space-y-1 font-body text-base leading-relaxed text-white/55">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>

      <Link
        to="/solutions"
        className="mt-8 inline-flex items-center gap-3 font-head text-xs tracking-[0.3em] text-white/75 transition-colors hover:text-magenta"
      >
        {discover} <ArrowRight className="h-4 w-4 text-magenta" />
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE — SPRINT 0C: HOMEPAGE NARRATIVE LAYOUT FOUNDATION
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { t } = useLang();
  const h = t.home;

  const cardsData = [
    {
      number: '01',
      icon: Globe,
      title: h.servicePremium.title,
      lines: h.servicePremium.lines,
      align: 'left',
    },
    {
      number: '02',
      icon: Settings,
      title: h.serviceAutomation.title,
      lines: h.serviceAutomation.lines,
      align: 'right',
    },
    {
      number: '03',
      icon: Sparkles,
      title: h.serviceAI.title,
      lines: h.serviceAI.lines,
      align: 'left',
    },
  ];

  return (
    <div className="lumyo-homepage home-section-bg relative min-h-screen overflow-hidden text-white">
      {/* ══════════════════════════════════════════════════════════
          1. HERO FOUNDATION (Dominant First Screen)
          ══════════════════════════════════════════════════════════ */}
      <Hero />

      {/* ══════════════════════════════════════════════════════════
          2. ATMOSPHERIC TRANSITION ZONE (Pure Breathing Space for Awakening)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-[45vh] w-full pointer-events-none flex items-center justify-center">
        <div className="fog-layer-hero absolute inset-0 z-0 opacity-40" />
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. SERVICE CARDS NARRATIVE CASCADE (Milestones: Card 01 -> Space -> Card 02 -> Space -> Card 03)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-[1600px] px-6 py-16 md:px-12">
        {/* Atmospheric Cards Fog */}
        <div className="fog-layer-cards pointer-events-none absolute left-[-5%] top-[20%] z-0 h-[600px] w-[600px] rounded-full" />

        <div className="flex flex-col gap-32 md:gap-48">
          {cardsData.map((card) => (
            <ServiceCard
              key={card.number}
              number={card.number}
              icon={card.icon}
              title={card.title}
              lines={card.lines}
              discover={t.common.discoverMore}
              align={card.align}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. OUR SOLUTIONS (Spacious Breathing Room & Portal Bridge)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden pt-36 pb-24 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12">
          <p className="text-center font-head text-sm tracking-mega text-magenta">
            {t.common.ourSolutions}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {h.solutionLabels.map((labels, i) => {
              const Icon = solutionIcons[i];
              const numStr = String(i + 1).padStart(2, '0');
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="portal flex flex-col items-center text-center"
                  data-testid={`solution-${numStr}`}
                >
                  <div className="solution-icon-wrap relative flex items-center justify-center">
                    <span className="portal-beam absolute left-2 top-0 h-full w-[2px] rounded-full" />
                    <span className="portal-beam absolute right-2 top-0 h-full w-[2px] rounded-full" />
                    <div className="solution-icon-circle flex items-center justify-center rounded-full border border-magenta/60 bg-magenta/15">
                      <Icon className="h-8 w-8 text-magenta" strokeWidth={1.4} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-0.5 font-head text-xs font-semibold tracking-[0.2em] text-white">
                    {labels.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>

                  <span className="mt-3 font-display text-xl tracking-widest text-magenta">
                    {numStr}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. DESIGN UNIQUE & DIAMOND (Narrative Grand Destination)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden pt-36 pb-28 md:pt-52 md:pb-40">
        {/* Atmospheric Diamond Fog */}
        <div className="fog-layer-diamond pointer-events-none absolute right-[10%] top-[10%] z-0 h-[550px] w-[550px] rounded-full" />

        {/* Floor rings ambient glow */}
        <div
          className="pointer-events-none absolute floor-rings-glow rounded-full opacity-85"
          style={{
            left: '50%',
            bottom: '4rem',
            transform: 'translateX(-50%)',
            width: '85%',
            maxWidth: '1100px',
            height: '300px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            {/* Left text column */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="max-w-lg"
            >
              <p className="font-head text-sm tracking-[0.3em] text-magenta">{h.designEyebrow}</p>
              <h2
                className="mt-3 font-head font-bold leading-tight text-white"
                style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}
              >
                {h.designHeading}
              </h2>
              <ul className="mt-5 space-y-3">
                {h.designList.map((li) => (
                  <li key={li} className="flex items-center gap-3 font-body text-lg text-white/65">
                    <Check className="h-5 w-5 flex-shrink-0 text-magenta" /> {li}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — Diamond image fused with background */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative flex items-center justify-center"
              style={{ height: 'clamp(320px, 38vw, 520px)' }}
            >
              <img
                src={IMAGES.diamond}
                alt="Diamond"
                className="absolute inset-0 h-full w-full object-contain diamond-img-enhanced"
                style={{
                  maskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 82%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 82%)',
                }}
              />
            </motion.div>
          </div>

          {/* CTA — integrated at bottom of Diamond section */}
          <div className="mt-12 text-center">
            <Link
              to="/contact"
              data-testid="bottom-cta"
              className="inline-flex items-center gap-5 pill-btn"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-magenta text-magenta ring-play">
                <span className="font-head text-xs font-bold">L</span>
              </span>
              <span className="font-head text-xs tracking-[0.3em] text-white">
                {t.footer.heading.toUpperCase()}
              </span>
              <ArrowRight className="h-5 w-5 text-magenta" />
            </Link>

            <p className="mt-5 font-body text-sm tracking-[0.2em] text-white/40">
              comercial@lumyo.pt
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
