import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Grip, Menu, X, ChevronDown } from 'lucide-react';
import { useLang } from '../i18n';

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { to: '/', label: t.nav.home, id: 'home' },
    { to: '/solutions', label: t.nav.solutions, id: 'solutions' },
    { to: '/case-studies', label: t.nav.cases, id: 'case-studies' },
    { to: '/studio', label: t.nav.studio, id: 'studio' },
    { to: '/contact', label: t.nav.contact, id: 'contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-ink/80 backdrop-blur-lg border-b border-magenta/15' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-4">
          <Grip className="h-5 w-5 text-magenta" />
          <span className="font-display text-lg tracking-[0.35em] text-white">LUMYO</span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              data-testid={`nav-${l.id}`}
              className={({ isActive }) =>
                `link-underline font-head text-xs tracking-[0.25em] transition-colors ${
                  isActive ? 'text-magenta active' : 'text-white/70 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            data-testid="lang-switch"
            onClick={toggle}
            className="hidden items-center gap-1 font-head text-xs tracking-[0.2em] text-white/70 transition-colors hover:text-magenta md:flex"
          >
            {lang === 'pt' ? 'PT' : 'ENG'} <ChevronDown className="h-3 w-3" />
          </button>
          <button
            data-testid="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-magenta/40 text-white ring-play"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div data-testid="mobile-menu" className="glass border-t border-magenta/15 lg:hidden">
          <div className="flex flex-col px-8 py-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-white/5 py-4 font-head text-sm tracking-[0.25em] ${
                    isActive ? 'text-magenta' : 'text-white/75'
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
              className="mt-4 text-left font-head text-sm tracking-[0.25em] text-magenta"
            >
              {lang === 'pt' ? 'SWITCH TO ENGLISH' : 'MUDAR PARA PORTUGUÊS'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
