import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { CONTACT_EMAIL } from '../data';
import ParticleField from './ParticleField';

export default function Footer() {
  return (
    <footer data-testid="footer" className="relative overflow-hidden border-t border-magenta/10 section-bg py-20">
      <ParticleField count={30} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 text-center md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-head text-3xl font-semibold text-white glow-soft md:text-5xl"
        >
          Let's build something unique.
        </motion.h2>

        <Link
          to="/contact"
          data-testid="footer-cta"
          className="mt-10 inline-flex items-center gap-5 pill-btn"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-magenta text-magenta">
            <Play className="h-4 w-4 fill-magenta" />
          </span>
          <span className="font-head text-sm tracking-[0.3em] text-white">START YOUR PROJECT</span>
          <ArrowRight className="h-4 w-4 text-magenta" />
        </Link>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          data-testid="footer-email"
          className="mt-8 block font-body text-lg tracking-wide text-white/60 hover:text-magenta"
        >
          {CONTACT_EMAIL}
        </a>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <span className="font-display text-sm tracking-[0.35em] text-white">LUMYO</span>
          <p className="font-head text-xs tracking-[0.2em] text-white/40">
            © {new Date().getFullYear()} LUMYO — BUILD DIGITAL SYSTEMS THAT SCALE
          </p>
          <div className="flex gap-6 font-head text-xs tracking-[0.25em] text-white/50">
            <a href="#li" className="hover:text-magenta">LI</a>
            <a href="#gh" className="hover:text-magenta">GH</a>
            <a href="#ig" className="hover:text-magenta">IG</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
