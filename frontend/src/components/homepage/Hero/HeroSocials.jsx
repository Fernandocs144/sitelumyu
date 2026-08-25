import React from 'react';
import { Linkedin, Instagram, Facebook } from 'lucide-react';

/**
 * HeroSocials — Discrete vertical right-side social navigation bar.
 */
export default function HeroSocials() {
  const socials = [
    {
      name: 'LinkedIn da Lumyo',
      icon: Linkedin,
      href: 'https://www.linkedin.com/company/lumyo-pt',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: 'https://www.instagram.com/lumyopt/',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: 'https://www.facebook.com/lumyopt',
    },
  ];

  return (
    <div
      data-hero-socials
      className="hidden lg:flex pointer-events-auto absolute right-6 xl:right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-5"
    >
      {/* Top subtle vertical line */}
      <span className="h-14 w-px bg-gradient-to-b from-transparent via-white/20 to-magenta/60" />

      {/* Social links */}
      <div className="flex flex-col items-center gap-3">
        {socials.map((item) => {
          const Icon = item.icon;

          const iconContent = (
            <Icon
              className="
                h-4
                w-4
                text-white/70
                transition-colors
                group-hover:text-magenta
              "
              strokeWidth={1.4}
            />
          );

          if (!item.href) {
            return (
              <div key={item.name} className="flex min-h-[44px] min-w-[44px] items-center justify-center">
                <span
                  role="img"
                  aria-label={`${item.name} — em breve`}
                  title={`${item.name} — em breve`}
                  className="
                    flex
                    h-9
                    w-9
                    cursor-default
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-black/20
                    opacity-30
                    backdrop-blur-md
                  "
                >
                  {iconContent}
                </span>
              </div>
            );
          }

          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.name}
              className="
                group
                flex
                min-h-[44px]
                min-w-[44px]
                items-center
                justify-center
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/15
                  bg-black/30
                  opacity-60
                  backdrop-blur-md
                  transition-all
                  duration-300
                  group-hover:border-magenta/60
                  group-hover:bg-magenta/10
                  group-hover:opacity-100
                  group-hover:shadow-[0_0_15px_rgba(255,45,120,0.45)]
                "
              >
                {iconContent}
              </span>
            </a>
          );
        })}
      </div>

      {/* Bottom subtle vertical line */}
      <span className="h-14 w-px bg-gradient-to-t from-transparent via-white/20 to-magenta/60" />
    </div>
  );
}