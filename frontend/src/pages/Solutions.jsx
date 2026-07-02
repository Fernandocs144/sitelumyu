import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Settings, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import ParticleField from '../components/ParticleField';

const icons = [Globe, Settings, Sparkles, TrendingUp];

export default function Solutions() {
  const { t } = useLang();
  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <p className="font-head text-sm tracking-mega text-magenta">{t.common.ourSolutions}</p>
        <h1 className="mt-6 max-w-3xl font-head text-4xl font-bold leading-tight text-white md:text-6xl">
          {t.solutions.heading}
        </h1>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {t.solutions.items.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass group relative overflow-hidden rounded-2xl p-10 transition-transform hover:-translate-y-2"
                data-testid={`solution-detail-${String(i + 1).padStart(2, '0')}`}
              >
                <span className="absolute right-8 top-8 font-display text-5xl text-magenta/15">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="h-10 w-10 text-magenta" strokeWidth={1.4} />
                <h2 className="mt-6 font-head text-3xl font-semibold text-white">{s.title}</h2>
                <div className="mt-3 space-y-0.5 font-body text-lg text-magenta/80">
                  {s.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
                <p className="mt-5 font-body text-lg leading-relaxed text-white/55">{s.body}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <Link to="/contact" data-testid="solutions-cta" className="inline-flex items-center gap-4 rounded-full border border-magenta px-8 py-4 pill-btn font-head text-sm tracking-[0.3em] text-white">
            {t.common.startProject} <ArrowRight className="h-4 w-4 text-magenta" />
          </Link>
        </div>
      </div>
    </div>
  );
}
