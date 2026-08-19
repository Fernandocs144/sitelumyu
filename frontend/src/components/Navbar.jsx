import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';

import { useLang } from '../i18n';

export default function Navbar() {
  const { t, lang, toggle } = useLang();
const [open, setOpen] = useState(false);

const location = useLocation();
const isHome = location.pathname === '/';

  const links = [
    { to: '/solutions', label: t.nav.solutions, id: 'solutions' },
    { to: '/case-studies', label: t.nav.cases, id: 'case-studies' },
    { to: '/studio', label: t.nav.studio, id: 'studio' },
    { to: '/contact', label: t.nav.contact, id: 'contact' },
  ];

  return (
    <header
  data-testid="navbar"
  className={`
    fixed top-0 left-0 right-0 z-50
    transition-all duration-300
    ${
      isHome
        ? 'bg-transparent'
        : 'border-b border-white/[0.06] bg-[#070513]/80 backdrop-blur-xl'
    }
  `}
>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-6 md:px-12">

        {/* LOGO */}
        <Link
          to="/"
          data-testid="logo-link"
          className="flex items-center gap-3"
        >
          <img
            src="/images/brand/lumyo-symbol.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-auto object-contain md:h-10"
          />

          <span className="font-display text-lg tracking-[0.35em] text-white">
            LUMYO
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.id}`}
              className={({ isActive }) =>
                `link-underline font-head text-xs tracking-[0.25em] transition-colors ${
                  isActive
                    ? 'text-magenta active'
                    : 'text-white/70 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-4">

          {/* DESKTOP LANGUAGE */}
          <button
            data-testid="lang-switch"
            onClick={toggle}
            aria-label={lang === 'pt' ? 'Mudar idioma para Inglês' : 'Switch language to Portuguese'}
            className="
              hidden
              min-h-[44px]
              items-center
              gap-1
              px-2
              font-head
              text-xs
              tracking-[0.2em]
              text-white/70
              transition-colors
              hover:text-magenta
              md:flex
            "
          >
            {lang === 'pt' ? 'PT' : 'ENG'}

            <ChevronDown className="h-3 w-3" />
          </button>

          {/* MOBILE / TABLET MENU */}
          <button
            data-testid="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-magenta/40
              text-white
              ring-play
              lg:hidden
            "
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div
          data-testid="mobile-menu"
          className="glass border-t border-magenta/15 lg:hidden"
        >
          <div className="flex flex-col px-8 py-6">

            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-white/5 py-4 font-head text-sm tracking-[0.25em] ${
                    isActive
                      ? 'text-magenta'
                      : 'text-white/75'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            <button
              data-testid="lang-switch-mobile"
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              aria-label={lang === 'pt' ? 'Mudar idioma para Inglês' : 'Switch language to Portuguese'}
              className="
                mt-4
                min-h-[44px]
                w-full
                text-left
                font-head
                text-sm
                tracking-[0.25em]
                text-magenta
                md:hidden
              "
            >
              {lang === 'pt'
                ? 'SWITCH TO ENGLISH'
                : 'MUDAR PARA PORTUGUÊS'}
            </button>

          </div>
        </div>
      )}
    </header>
  );
}