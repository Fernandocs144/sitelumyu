import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// A glowing vertical "energy connection" that draws down the whole page as you
// scroll — starting at the robot (top) and flowing to the end of the page.
export default function ScrollConnection() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  // Comet travels from top (5%) to bottom (95%) of the viewport-height track.
  const cometTop = useTransform(progress, [0, 1], ['4%', '96%']);
  const pathLength = progress; // 0 → 1 draws the line
  const glowOpacity = useTransform(progress, [0, 0.05, 0.95, 1], [0.2, 1, 1, 0.5]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-0 z-40 hidden h-screen w-16 md:block"
      data-testid="scroll-connection"
    >
      <svg className="h-full w-full overflow-visible" viewBox="0 0 40 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lumyoLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2d78" />
            <stop offset="55%" stopColor="#a020f0" />
            <stop offset="100%" stopColor="#4b6bff" />
          </linearGradient>
          <filter id="lumyoGlow" x="-200%" y="-50%" width="500%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* faint full track */}
        <line x1="20" y1="0" x2="20" y2="800" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="2" />

        {/* drawn progress line */}
        <motion.line
          x1="20"
          y1="0"
          x2="20"
          y2="800"
          stroke="url(#lumyoLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#lumyoGlow)"
          style={{ pathLength, opacity: glowOpacity }}
        />
      </svg>

      {/* Comet dot travelling along the line */}
      <motion.span
        className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
        style={{
          top: cometTop,
          background: '#ff5ea8',
          boxShadow: '0 0 14px 4px rgba(255,45,120,0.9), 0 0 30px 8px rgba(160,32,240,0.5)',
        }}
      />

      {/* Endpoint markers (echoing the mockup's right-side dots) */}
      <div className="absolute right-0 top-[18%] flex flex-col gap-6">
        {['LI', 'GH', 'IG'].map((t) => (
          <span key={t} className="rotate-90 font-head text-[10px] tracking-[0.3em] text-magenta/70">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
