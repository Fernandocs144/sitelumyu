import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Globe, Settings, Sparkles, TrendingUp, Check } from 'lucide-react';
import { IMAGES } from '../data';
import ParticleField from '../components/ParticleField';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const heroFeatures = [
  { n: '01', t: 'PREMIUM WEBSITES', d: ['Designed to impress.', 'Built to convert.'] },
  { n: '02', t: 'AI AUTOMATION', d: ['Save time.', 'Automate repetitive work.'] },
  { n: '03', t: 'DIGITAL GROWTH', d: ['Generate leads.', 'Increase conversions.'] },
  { n: '04', t: 'TAILORED SOLUTIONS', d: ['Every project is unique.', 'Every solution is custom.'] },
];

const solutions = [
  { n: '01', icon: Globe, t: ['PREMIUM', 'WEBSITES'] },
  { n: '02', icon: Settings, t: ['AUTOMATION'] },
  { n: '03', icon: Sparkles, t: ['AI', 'SOLUTIONS'] },
  { n: '04', icon: TrendingUp, t: ['DIGITAL', 'GROWTH'] },
];

function ServiceCard({ icon: Icon, kicker, title, lines, align = 'left' }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className={`glass relative z-10 max-w-md rounded-2xl p-8 md:p-10 ${
        align === 'right' ? 'ml-auto text-left' : ''
      }`}
      data-testid={`service-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Icon className="h-8 w-8 text-magenta" strokeWidth={1.4} />
      <div className="mt-6 h-px w-10 bg-magenta/60" />
      <h3 className="mt-4 font-head text-3xl font-semibold leading-tight tracking-wide text-white md:text-4xl">
        {title}
      </h3>
      <div className="mt-5 space-y-1 font-body text-lg text-white/55">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <button className="mt-8 flex items-center gap-3 font-head text-xs tracking-[0.3em] text-white/80 hover:text-magenta transition-colors">
        DISCOVER MORE <ArrowRight className="h-4 w-4 text-magenta" />
      </button>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden section-bg pt-28">
        <ParticleField count={45} />
        {/* Robot image */}
        <div className="pointer-events-none absolute right-0 top-16 z-0 w-[62%] max-w-[900px] md:top-8">
          <img
            src={IMAGES.robot}
            alt="AI robot"
            className="w-full object-contain opacity-90 animate-floaty"
            style={{ maskImage: 'linear-gradient(to left, black 60%, transparent 98%)', WebkitMaskImage: 'linear-gradient(to left, black 60%, transparent 98%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="font-head text-sm tracking-[0.3em] text-magenta">01</span>
              <span className="h-px w-12 bg-magenta/50" />
            </div>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl">
              <span className="block tracking-[0.08em]">BUILD DIGITAL</span>
              <span className="mt-3 block text-5xl tracking-[0.12em] glow-pink sm:text-6xl md:text-8xl">
                SYSTEMS
              </span>
              <span className="mt-3 block font-head text-2xl tracking-mega text-magenta md:text-3xl">
                THAT SCALE
              </span>
            </h1>
            <p className="mt-8 max-w-md font-body text-lg leading-relaxed text-white/60">
              Premium websites, AI automation and intelligent digital systems designed for
              ambitious businesses.
            </p>

            <Link
              to="/contact"
              data-testid="hero-cta"
              className="mt-10 inline-flex items-center gap-5 pill-btn"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-magenta text-magenta ring-play">
                <Play className="h-5 w-5 fill-magenta" />
              </span>
              <span className="font-head text-sm tracking-[0.3em] text-white">START YOUR PROJECT</span>
              <ArrowRight className="h-5 w-5 text-magenta" />
            </Link>
          </motion.div>

          {/* Feature strip */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="hero-card-strip mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4"
          >
            {heroFeatures.map((f) => (
              <div key={f.n} className="p-7" data-testid={`hero-feature-${f.n}`}>
                <span className="font-head text-xs tracking-[0.3em] text-magenta">{f.n}</span>
                <h4 className="mt-3 font-head text-sm font-semibold tracking-[0.2em] text-white">
                  {f.t}
                </h4>
                <div className="mt-3 space-y-0.5 font-body text-white/50">
                  {f.d.map((d) => (
                    <p key={d}>{d}</p>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PREMIUM WEBSITES */}
      <section className="relative overflow-hidden bg-ink py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${IMAGES.streams})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <ServiceCard
            icon={Globe}
            title="PREMIUM WEBSITES"
            lines={['Designed to impress.', 'Engineered to convert.', 'Built to grow.']}
          />
        </div>
      </section>

      {/* AUTOMATION */}
      <section className="relative overflow-hidden bg-night py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${IMAGES.streams})`, transform: 'scaleX(-1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink via-ink/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <ServiceCard
            icon={Settings}
            title="AUTOMATION"
            lines={['Less repetitive work.', 'More productivity.', 'More time to grow.']}
            align="right"
          />
        </div>
      </section>

      {/* ARTIFICIAL INTELLIGENCE */}
      <section className="relative overflow-hidden bg-ink py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${IMAGES.network})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/50 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <ServiceCard
            icon={Sparkles}
            title="ARTIFICIAL INTELLIGENCE"
            lines={['AI assistants.', 'Intelligent workflows.', 'Real business impact.']}
          />
        </div>
      </section>

      {/* OUR SOLUTIONS */}
      <section className="relative overflow-hidden section-bg py-28">
        <ParticleField count={35} />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <p className="text-center font-head text-sm tracking-mega text-magenta">OUR SOLUTIONS</p>
          <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {solutions.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="portal flex flex-col items-center text-center"
                data-testid={`solution-${s.n}`}
              >
                <div className="relative flex h-40 w-full max-w-[180px] items-center justify-center">
                  <span className="portal-beam absolute left-4 top-0 h-full w-[3px] rounded-full" />
                  <span className="portal-beam absolute right-4 top-0 h-full w-[3px] rounded-full" />
                  <s.icon className="h-9 w-9 text-magenta animate-pulseGlow" strokeWidth={1.4} />
                </div>
                <div className="mt-4 space-y-0.5 font-head text-sm font-semibold tracking-[0.2em] text-white">
                  {s.t.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
                <span className="mt-4 font-display text-2xl tracking-widest text-magenta/80">
                  {s.n}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DESIGN UNIQUE */}
      <section className="relative overflow-hidden bg-ink py-28">
        <div
          className="absolute right-0 top-0 h-full w-[65%] bg-contain bg-right bg-no-repeat opacity-80"
          style={{ backgroundImage: `url(${IMAGES.diamond})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/50 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <p className="font-head text-sm tracking-[0.3em] text-magenta">DESIGN UNIQUE</p>
            <h2 className="mt-6 font-head text-4xl font-bold leading-tight text-white md:text-6xl">
              Every business deserves a unique solution.
            </h2>
            <ul className="mt-8 space-y-3">
              {['No templates.', 'No shortcuts.', 'Only tailored digital systems.'].map((li) => (
                <li key={li} className="flex items-center gap-3 font-body text-lg text-white/60">
                  <Check className="h-5 w-5 text-magenta" /> {li}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
