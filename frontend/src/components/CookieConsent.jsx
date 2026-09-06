import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import {
  COOKIE_PREFERENCES_EVENT,
  disableClarity,
  getAnalyticsConsent,
  loadClarity,
  setAnalyticsConsent,
} from '../analytics/clarity';

export default function CookieConsent() {
  const { t } = useLang();
  const copy = t.cookieConsent;
  const [consent, setConsent] = useState(() => getAnalyticsConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (consent === 'accepted') loadClarity();
  }, [consent]);

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true);

    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  const acceptAnalytics = () => {
    setAnalyticsConsent('accepted');
    setConsent('accepted');
    setPreferencesOpen(false);
  };

  const rejectAnalytics = () => {
    const wasAccepted = consent === 'accepted';

    disableClarity();
    setAnalyticsConsent('rejected');
    setConsent('rejected');
    setPreferencesOpen(false);

    if (wasAccepted) {
      window.location.reload();
    }
  };

  if (consent !== null && !preferencesOpen) return null;

  return (
    <>
      <style>{`
        .lumyo-chat-trigger-btn,
        .lumyo-chat-panel {
          display: none !important;
        }
      `}</style>

      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="lumyo-cookie-title"
        aria-describedby="lumyo-cookie-description"
        className="fixed inset-x-3 bottom-3 z-[10000] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#12051d]/95 p-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6"
      >
        <h2
          id="lumyo-cookie-title"
          className="font-display text-lg tracking-wide sm:text-xl"
        >
          {copy.title}
        </h2>

        <p
          id="lumyo-cookie-description"
          className="mt-2 font-body text-sm leading-relaxed text-white/75"
        >
          {copy.description}{' '}
          <Link
            to="/cookies"
            className="underline decoration-magenta underline-offset-4 hover:text-white"
          >
            {copy.learnMore}
          </Link>
        </p>

        {preferencesOpen && consent !== null && (
          <p className="mt-2 font-body text-xs text-white/55">
            {copy.currentChoice}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={rejectAnalytics}
            className="min-h-[46px] rounded-xl border border-white/25 px-5 font-head text-xs tracking-[0.12em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {copy.reject}
          </button>

          <button
            type="button"
            onClick={acceptAnalytics}
            className="min-h-[46px] rounded-xl border border-magenta bg-magenta px-5 font-head text-xs tracking-[0.12em] text-white transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {copy.accept}
          </button>
        </div>
      </section>
    </>
  );
}