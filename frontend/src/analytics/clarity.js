const CLARITY_PROJECT_ID = 'yci3f3n410';
const CLARITY_SCRIPT_ID = 'lumyo-clarity-script';

export const ANALYTICS_CONSENT_STORAGE_KEY = 'lumyo_analytics_consent';
export const COOKIE_PREFERENCES_EVENT = 'lumyo:open-cookie-preferences';

export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  } catch {
    // Se o armazenamento estiver indisponível, a preferência não persiste.
  }
}

function ensureClarityQueue() {
  if (typeof window === 'undefined') return null;

  window.clarity = window.clarity || function clarityQueue() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  return window.clarity;
}

export function loadClarity() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    getAnalyticsConsent() !== 'accepted'
  ) {
    return;
  }

  const clarity = ensureClarityQueue();
  clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted',
  });

  if (document.getElementById(CLARITY_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = CLARITY_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  script.referrerPolicy = 'strict-origin-when-cross-origin';
  document.head.appendChild(script);
}

export function disableClarity() {
  if (typeof window === 'undefined') return;

  if (typeof window.clarity === 'function') {
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: 'denied',
    });
    window.clarity('consent', false);
  }
}

export function trackClarityEvent(eventName) {
  if (
    typeof window === 'undefined' ||
    getAnalyticsConsent() !== 'accepted' ||
    typeof window.clarity !== 'function'
  ) {
    return;
  }

  window.clarity('event', eventName);
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}
