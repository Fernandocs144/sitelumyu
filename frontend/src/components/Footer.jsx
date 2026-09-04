import React, { useLayoutEffect, useRef } from 'react';
import { createHomeFooterExperience } from './FooterTimeline';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

import { useLang } from '../i18n';
import { openCookiePreferences } from '../analytics/clarity';

export default function Footer({ variant = 'default' }) {
  const { t } = useLang();
  const f = t.footer;

  if (variant === 'home') {
    return <HomeFooter f={f} cookieConsent={t.cookieConsent} />;
  }

  return <DefaultFooter f={f} cookieConsent={t.cookieConsent} />;
}

/* ===================================================== */
/* HOME FOOTER                                           */
/* ===================================================== */

function HomeFooter({ f, cookieConsent }) {
  const footerRef = useRef(null);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useLayoutEffect(() => {
    const footerElement = footerRef.current;

    if (!footerElement) {
      return undefined;
    }

    const timeline = createHomeFooterExperience(footerElement);

    return () => {
      if (timeline) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      }
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      data-home-footer
      data-testid="footer"
      className="
        relative
        overflow-hidden
        bg-transparent
        text-white
      "
    >
      {/* TRANSIÇÃO ENTRE CONTACT E FOOTER */}
      <div className="relative h-[4vh] md:h-[6vh]" />

      {/* GLASS PANEL */}
      <div
        data-home-footer-panel
        className="
          relative
          z-10
          mx-auto
          w-[92%]
          max-w-[1700px]
          overflow-hidden
          rounded-[1.5rem]
          border
          border-white/[0.08]
          bg-black/[0.10]
          shadow-[0_25px_80px_rgba(0,0,0,0.12)]
          backdrop-blur-[3px]
          md:w-[88%]
        "
      >
        {/* Brilho interno subtil */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/15
            to-transparent
          "
        />

        <div
          className="
            relative
            px-6
            pb-7
            pt-8
            sm:pt-10
            md:px-10
            md:pb-8
            md:pt-12
            lg:px-14
            lg:pb-9
            lg:pt-14
          "
        >
          {/* MAIN GRID */}
          <div
            className="
              grid
              gap-8
              sm:gap-10
              md:grid-cols-2
              md:gap-12
              lg:grid-cols-[1.35fr_0.8fr_1fr_1fr]
              lg:gap-10
            "
          >
            {/* BRAND */}
            <div className="max-w-[330px]">
              <Link
                to="/"
                className="
                  inline-block
                  font-display
                  text-[1.8rem]
                  tracking-[0.08em]
                  text-white/85
                "
              >
                LUMYO
              </Link>

              <p
                className="
                  mt-4
                  max-w-[290px]
                  font-body
                  text-[13px]
                  leading-[1.8]
                  text-white/85
                  sm:mt-6
                "
              >
                {f.copyright}
              </p>

              <div
                className="
                  mt-6
                  flex
                  items-center
                  gap-3
                  sm:mt-8
                "
              >
                <span className="h-px w-8 bg-magenta/70" />
                <span
                  className="
                    font-head
                    text-[8px]
                    tracking-[0.28em]
                    text-white/85
                  "
                >
                  {f.eyebrow}
                </span>
              </div>
            </div>

            {/* NAVIGATION */}
            <FooterColumn title={f.navigation}>
              <FooterLink to="/">{f.home}</FooterLink>
              <FooterLink to="/solutions">{f.solutions}</FooterLink>
              <FooterLink to="/case-studies">{f.cases}</FooterLink>
              <FooterLink to="/studio">{f.studio}</FooterLink>
              <FooterLink to="/contact">{f.contact}</FooterLink>
            </FooterColumn>

            {/* EXPERTISE */}
            <FooterColumn title={f.expertise}>
              {f.services?.map((service) => (
                <span
                  key={service}
                  className="
                    block
                    font-body
                    text-[13px]
                    leading-[1.6]
                    text-white/85
                  "
                >
                  {service}
                </span>
              ))}
            </FooterColumn>

            {/* SOCIAL / DIRECT */}
            <div>
              <span
                className="
                  mb-4
                  block
                  font-head
                  font-bold
                  text-[9px]
                  tracking-[0.28em]
                  text-magenta/90
                  sm:mb-6
                "
              >
                {f.social}
              </span>

              <div className="flex flex-col items-start gap-3">
                <SocialLink href="https://www.linkedin.com/company/lumyo-pt" aria-label="LinkedIn da Lumyo">
                  LINKEDIN
                </SocialLink>
                <SocialLink href="https://www.instagram.com/lumyopt/">
                  INSTAGRAM
                </SocialLink>
                <SocialLink href="https://www.facebook.com/lumyopt">
                  FACEBOOK
                </SocialLink>
              </div>

              {/* DIRECT */}
              <div className="mt-8 sm:mt-10">
                <span
                  className="
                    mb-4
                    block
                    font-head
                    text-[9px]
                    tracking-[0.28em]
                    text-magenta/90
                    sm:mb-5
                  "
                >
                  DIRECT
                </span>

                <Link
                  to="/contact"
                  className="
                    group
                    inline-flex
                    items-center
                    gap-3
                    font-body
                    text-[13px]
                    text-white/60
                    transition-colors
                    duration-300
                    hover:text-white
                  "
                >
                  {f.startProject}
                  <span
                    className="
                      h-px
                      w-6
                      bg-white/30
                      transition-all
                      duration-300
                      group-hover:w-10
                      group-hover:bg-magenta
                    "
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div
            className="
              mt-10
              flex
              flex-col
              gap-4
              border-t
              border-white/[0.08]
              pt-6
              sm:mt-12
              sm:gap-5
              md:mt-14
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div className="flex flex-wrap items-center gap-6">
              <p
                className="
                  font-head
                  text-[8px]
                  tracking-[0.22em]
                  text-white/50
                "
              >
                © {new Date().getFullYear()} LUMYO. ALL RIGHTS RESERVED.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  to="/privacy"
                  className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
                >
                  Privacidade
                </Link>
                <Link
                  to="/cookies"
                  className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
                >
                  Cookies
                </Link>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
                >
                  {cookieConsent.manage}
                </button>
                <Link
                  to="/terms"
                  className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
                >
                  Termos
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Voltar ao topo"
              className="
                group
                flex
                min-h-[44px]
                items-center
                gap-3
                self-start
                font-head
                text-[8px]
                tracking-[0.22em]
                text-white/65
                transition-colors
                duration-300
                hover:text-white
                md:self-auto
              "
            >
              BACK TO TOP
              <ArrowUp
                size={12}
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-y-1
                "
              />
            </button>
          </div>
        </div>
      </div>

      {/* ESPAÇO FINAL */}
      <div className="relative h-[5vh] md:h-[7vh]" />
    </footer>
  );
}

/* ===================================================== */
/* DEFAULT FOOTER                                        */
/* ===================================================== */

function DefaultFooter({ f, cookieConsent }) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer
      data-testid="footer"
      className="
        relative
        overflow-hidden
        border-t
        border-white/[0.08]
        bg-transparent
        text-white/65
      "
    >
      <div
        className="
          mx-auto
          max-w-[1700px]
          px-6
          py-12
          md:px-12
          md:py-16
          lg:px-[6vw]
        "
      >
        <div
          className="
            grid
            gap-10
            md:grid-cols-3
            md:gap-12
            lg:grid-cols-[1.3fr_1fr_1fr]
          "
        >
          {/* BRAND */}
          <div className="max-w-[330px]">
            <Link
              to="/"
              className="
                inline-block
                font-display
                text-2xl
                tracking-[0.1em]
                text-white/65
              "
            >
              LUMYO
            </Link>

            <p
              className="
                mt-4
                font-body
                text-sm
                leading-relaxed
                text-white/65
                sm:mt-5
              "
            >
              {f.copyright}
            </p>

            <div
              className="
                mt-6
                flex
                items-center
                gap-3
                sm:mt-7
              "
            >
              <span className="h-px w-7 bg-magenta/60" />
              <span
                className="
                  font-head
                  text-[8px]
                  tracking-[0.25em]
                  text-white/65
                "
              >
                {f.eyebrow}
              </span>
            </div>
          </div>

          {/* NAVIGATION */}
          <FooterColumn title={f.navigation}>
            <FooterLink to="/">{f.home}</FooterLink>
            <FooterLink to="/solutions">{f.solutions}</FooterLink>
            <FooterLink to="/case-studies">{f.cases}</FooterLink>
            <FooterLink to="/studio">{f.studio}</FooterLink>
            <FooterLink to="/contact">{f.contact}</FooterLink>
          </FooterColumn>

          {/* EXPERTISE */}
          <FooterColumn title={f.expertise}>
            {f.services?.map((service) => (
              <span
                key={service}
                className="
                  block
                  font-body
                  font-bold
                  text-[13px]
                  leading-[1.6]
                  text-white/65
                "
              >
                {service}
              </span>
            ))}
          </FooterColumn>
        </div>

        {/* BOTTOM */}
        <div
          className="
            mt-10
            flex
            flex-col
            gap-4
            border-t
            border-white/[0.08]
            pt-6
            sm:mt-12
            sm:gap-5
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div className="flex flex-wrap items-center gap-6">
            <span
              className="
                font-head
                text-[8px]
                tracking-[0.22em]
                text-white/65
              "
            >
              © {new Date().getFullYear()} LUMYO
            </span>

            <div className="flex items-center gap-4">
              <Link
                to="/privacy"
                className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
              >
                Privacidade
              </Link>
              <Link
                to="/cookies"
                className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
              >
                Cookies
              </Link>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
              >
                {cookieConsent.manage}
              </button>
              <Link
                to="/terms"
                className="inline-flex min-h-[44px] items-center font-head text-[8px] tracking-[0.22em] text-white/50 transition-colors duration-300 hover:text-magenta"
              >
                Termos
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
            className="
              group
              flex
              min-h-[44px]
              items-center
              gap-3
              self-start
              font-head
              text-[8px]
              tracking-[0.22em]
              text-white/65
              transition-colors
              duration-300
              hover:text-white
              md:self-auto
            "
          >
            BACK TO TOP
            <ArrowUp
              size={12}
              className="
                transition-transform
                duration-300
                group-hover:-translate-y-1
              "
            />
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ===================================================== */
/* COMPONENTES AUXILIARES                                */
/* ===================================================== */

function FooterColumn({ title, children }) {
  return (
    <div>
      <span
        className="
          mb-4
          block
          font-head
          font-bold
          text-[9px]
          tracking-[0.28em]
          text-magenta/90
          sm:mb-6
        "
      >
        {title}
      </span>

      <div className="flex flex-col items-start gap-3">
        {children}
      </div>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="
        group
        relative
        font-body
        text-[13px]
        text-white/85
        transition-colors
        duration-300
        hover:text-white
      "
    >
      {children}
      <span
        className="
          absolute
          bottom-[-3px]
          left-0
          h-px
          w-0
          bg-magenta
          transition-all
          duration-300
          group-hover:w-full
        "
      />
    </Link>
  );
}

function SocialLabel({ children }) {
  return (
    <span
      className="
        font-body
        font-bold
        text-[13px]
        text-white/65
      "
    >
      {children}
    </span>
  );
}

function SocialLink({ href, 'aria-label': ariaLabel, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel || (typeof children === 'string' ? `${children} da Lumyo` : undefined)}
      className="
        group
        relative
        font-body
        font-bold
        text-[13px]
        text-white/65
        transition-colors
        duration-300
        hover:text-white
      "
    >
      {children}
      <span
        className="
          absolute
          bottom-[-3px]
          left-0
          h-px
          w-0
          bg-magenta
          transition-all
          duration-300
          group-hover:w-full
        "
      />
    </a>
  );
}
