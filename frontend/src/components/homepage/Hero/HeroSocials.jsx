import React from 'react';
import { Linkedin, Instagram, Twitter, Github } from 'lucide-react';

/**
 * HeroSocials — Discrete vertical right-side social navigation bar (Sprint 1.4 Restored).
 */
export default function HeroSocials() {
  const socials = [
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'X', icon: Twitter, href: 'https://x.com' },
    { name: 'GitHub', icon: Github, href: 'https://github.com' },
  ];

  return (
    <div
      data-hero-socials
      className="hidden xl:flex pointer-events-auto absolute right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-5"
    >
      {/* Top subtle vertical line */}
      <span className="h-14 w-px bg-gradient-to-b from-transparent via-white/20 to-magenta/60" />

      {/* Social links */}
      <div className="flex flex-col items-center gap-3">
        {socials.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.name}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md opacity-60 transition-all duration-300 hover:opacity-100 hover:border-magenta/60 hover:bg-magenta/10 hover:shadow-[0_0_15px_rgba(255,45,120,0.45)]"
            >
              <Icon className="h-4 w-4 text-white/70 transition-colors group-hover:text-magenta" strokeWidth={1.4} />
            </a>
          );
        })}
      </div>

      {/* Bottom subtle vertical line */}
      <span className="h-14 w-px bg-gradient-to-t from-transparent via-white/20 to-magenta/60" />
    </div>
  );
}
