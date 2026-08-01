import React from 'react';
import { useLang } from '../i18n';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer
      data-testid="footer"
      className="relative"
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1.5rem 0',
        background: 'rgba(8, 4, 20, 0.8)',
      }}
    >
      <div
        className="mx-auto flex flex-col items-center justify-between gap-3 px-6 md:flex-row md:px-12"
        style={{ maxWidth: '1600px' }}
      >
        <span className="font-display text-sm tracking-[0.35em] text-white/70">LUMYO</span>

        <p className="font-head text-xs tracking-[0.2em] text-white/30">
          © {new Date().getFullYear()} LUMYO — {t.footer.copyright}
        </p>

        <div className="flex gap-6 font-head text-xs tracking-[0.25em] text-white/35">
          <a href="#li" className="transition-colors hover:text-magenta">LI</a>
          <a href="#gh" className="transition-colors hover:text-magenta">GH</a>
          <a href="#ig" className="transition-colors hover:text-magenta">IG</a>
        </div>
      </div>
    </footer>
  );
}
