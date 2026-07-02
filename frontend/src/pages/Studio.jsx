import React from 'react';
import { motion } from 'framer-motion';
import { Compass, PenTool, Code2, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../data';
import ParticleField from '../components/ParticleField';

const process = [
  { icon: Compass, n: '01', t: 'Discover', d: 'We dig into your goals, users and constraints before a single pixel is drawn.' },
  { icon: PenTool, n: '02', t: 'Design', d: 'Bespoke interfaces and systems crafted around your brand — never templated.' },
  { icon: Code2, n: '03', t: 'Build', d: 'Clean, scalable engineering with automation and AI baked into the core.' },
  { icon: Rocket, n: '04', t: 'Scale', d: 'We measure, optimise and grow the system alongside your business.' },
];

const values = [
  'Craft over quantity.',
  'Systems over one-off pages.',
  'Partnership over projects.',
  'Impact over vanity metrics.',
];

export default function Studio() {
  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-head text-sm tracking-mega text-magenta">THE STUDIO</p>
            <h1 className="mt-6 font-head text-4xl font-bold leading-tight text-white md:text-6xl">
              A studio for ambitious businesses.
            </h1>
            <p className="mt-6 max-w-lg font-body text-lg leading-relaxed text-white/60">
              LUMYO is a digital studio building premium websites, AI automation and intelligent
              systems. We partner with businesses that refuse to settle for templates — and we build
              digital systems that scale with them.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v} className="glass rounded-xl px-5 py-4 font-body text-white/70" data-testid={`value-${v}`}>
                  {v}
                </div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl"
          >
            <img src={IMAGES.diamond} alt="LUMYO studio" className="w-full object-cover animate-floaty" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          </motion.div>
        </div>

        <div className="mt-28">
          <p className="text-center font-head text-sm tracking-mega text-magenta">HOW WE WORK</p>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 transition-transform hover:-translate-y-2"
                data-testid={`process-${p.n}`}
              >
                <p.icon className="h-9 w-9 text-magenta" strokeWidth={1.4} />
                <span className="mt-6 block font-display text-2xl text-magenta/70">{p.n}</span>
                <h3 className="mt-2 font-head text-2xl font-semibold text-white">{p.t}</h3>
                <p className="mt-3 font-body text-white/55">{p.d}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <Link to="/contact" data-testid="studio-cta" className="inline-flex items-center gap-4 rounded-full border border-magenta px-8 py-4 pill-btn font-head text-sm tracking-[0.3em] text-white">
            WORK WITH US
          </Link>
        </div>
      </div>
    </div>
  );
}
