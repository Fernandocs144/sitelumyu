import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { useLang } from '../../../i18n';

/**
 * HeroContent — Independent content layer for Hero section.
 * Contains Headline and CTA Button with spacious breathing layout.
 * Eliminates any horizontal cutting bar for seamless atmospheric flow.
 */
const HeroContent = forwardRef(function HeroContent(props, ref) {
  const { t } = useLang();
  const h = t.home;

  return (
    <div
      ref={ref}
      data-hero-content
      className="relative z-20 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-6 pt-28 pb-20 md:px-12"
    >
      {/* Hero Text & CTA */}
      <div className="max-w-2xl pt-6">
        <div className="flex items-center gap-4">
          <span className="font-head text-sm tracking-[0.3em] text-magenta">01</span>
          <span className="h-px w-14 bg-magenta/70" />
        </div>

        <h1 className="mt-6 font-display leading-[1.08] text-white" style={{ fontSize: 'clamp(1.8rem, 5vw, 4.2rem)' }}>
          <span className="block tracking-[0.08em]">{h.heroLine1}</span>
          <span
            className="mt-2 block tracking-[0.1em] text-outline-glow glow-pink hero-text-sync"
            style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
          >
            {h.heroLine2}
          </span>
          <span
            className="mt-3 block font-head tracking-mega glow-magenta-text"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2.4rem)' }}
          >
            {h.heroLine3}
          </span>
        </h1>

        <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-white/60">
          {h.heroDesc}
        </p>

        <Link
          to="/contact"
          data-testid="hero-cta"
          className="mt-10 inline-flex items-center gap-5 pill-btn"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-magenta text-magenta ring-play">
            <Play className="h-5 w-5 fill-magenta" />
          </span>
          <span className="font-head text-xs tracking-[0.3em] text-white">
            {t.common.startProject}
          </span>
          <ArrowRight className="h-5 w-5 text-magenta" />
        </Link>
      </div>
    </div>
  );
});

export default HeroContent;
