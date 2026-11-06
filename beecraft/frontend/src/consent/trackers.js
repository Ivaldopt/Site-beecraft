import { hasConsent, onConsentChange } from './consent';

const GA_ID = (import.meta.env.VITE_GA_ID ?? '').trim();
const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim();

function addScript(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGoogleAnalytics() {
  if (!GA_ID || !/^G-[A-Z0-9]+$/.test(GA_ID) || window.__beecraftGa) return;
  window.__beecraftGa = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  addScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, 'beecraft-ga');
}

function loadMetaPixel() {
  if (!META_PIXEL_ID || !/^\d+$/.test(META_PIXEL_ID) || window.__beecraftMeta) return;
  window.__beecraftMeta = true;
  // Código oficial do Pixel da Meta, só executado depois do consentimento.
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function removeCookies(prefixes) {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (prefixes.some((prefix) => name.startsWith(prefix))) {
      const host = window.location.hostname;
      [host, `.${host}`, `.${host.replace(/^www\./, '')}`].forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

/** Carrega scripts de terceiros SÓ para as categorias aceites; limpa o que foi retirado. */
export function applyConsent() {
  if (hasConsent('analytics')) loadGoogleAnalytics();
  else {
    removeCookies(['_ga', '_gid', '_gat']);
    try { localStorage.removeItem('beecraft-visitor-id'); } catch { /* ignorar */ }
  }
  if (hasConsent('marketing')) loadMetaPixel();
  else removeCookies(['_fbp', '_fbc']);
}

/** Chamar uma vez no arranque da app. */
export function startTrackers() {
  applyConsent();
  return onConsentChange(applyConsent);
}
