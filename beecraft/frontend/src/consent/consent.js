import { TERMS_VERSION } from '../legal/version';

const KEY = 'beecraft-consent';
const EVENT = 'beecraft-consent-change';

/** Lê a escolha guardada; null = o utilizador ainda não escolheu. */
export function readConsent() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!stored || typeof stored.analytics !== 'boolean' || typeof stored.marketing !== 'boolean') return null;
    return stored;
  } catch {
    return null;
  }
}

export function hasConsent(category) {
  return readConsent()?.[category] === true;
}

export function saveConsent({ analytics, marketing }) {
  const choice = { analytics, marketing, decidedAt: new Date().toISOString(), version: TERMS_VERSION };
  try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch { /* armazenamento bloqueado */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
  return choice;
}

export function onConsentChange(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
