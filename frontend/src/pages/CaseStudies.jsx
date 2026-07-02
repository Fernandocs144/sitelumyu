import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../data';
import { useLang } from '../i18n';
import ParticleField from '../components/ParticleField';

const imgs = [IMAGES.streams, IMAGES.network, IMAGES.diamond];

export default function CaseStudies() {
  const { t } = useLang();
  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <p className="font-head text-sm tracking-mega text-magenta">{t.nav.cases}</p>
        <h1 className="mt-6 max-w-3xl font-head text-4xl font-bold leading-tight text-white md:text-6xl">
          {t.cases.heading}
        </h1>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {t.cases.stats.map((s) => (
            <div key={s.l} className="glass rounded-2xl p-6 text-center" data-testid={`stat-${s.k}`}>
              <p className="font-display text-3xl text-white glow-pink">{s.k}</p>
              <p className="mt-2 font-head text-xs tracking-[0.2em] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 space-y-8">
          {t.cases.items.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass group grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-2"
              data-testid={`case-${i}`}
            >
              <div className="relative h-56 overflow-hidden md:h-auto">
                <img
                  src={imgs[i]}
                  alt={c.title}
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              </div>
              <div className="p-10">
                <span className="font-head text-xs tracking-[0.3em] text-magenta">{c.tag}</span>
                <h2 className="mt-4 flex items-center gap-2 font-head text-3xl font-semibold text-white">
                  {c.title}
                  <ArrowUpRight className="h-6 w-6 text-magenta transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </h2>
                <p className="mt-3 font-display text-xl text-hotpink glow-soft">{c.result}</p>
                <p className="mt-4 font-body text-lg leading-relaxed text-white/55">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link to="/contact" data-testid="cases-cta" className="inline-flex items-center gap-4 rounded-full border border-magenta px-8 py-4 pill-btn font-head text-sm tracking-[0.3em] text-white">
            {t.cases.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
