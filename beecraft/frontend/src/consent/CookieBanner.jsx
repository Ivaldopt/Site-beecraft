import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { onConsentChange, readConsent, saveConsent } from './consent';

export const OPEN_COOKIE_SETTINGS = 'beecraft-open-cookie-settings';

export default function CookieBanner() {
  const [decided, setDecided] = useState(() => readConsent() !== null);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(() => readConsent()?.analytics ?? false);
  const [marketing, setMarketing] = useState(() => readConsent()?.marketing ?? false);
  const headingRef = useRef(null);

  useEffect(() => {
    const reopen = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setSettings(true);
      setDecided(false);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    const stop = onConsentChange(() => setDecided(true));
    return () => { window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen); stop(); };
  }, []);

  useEffect(() => {
    if (settings && !decided) headingRef.current?.focus();
  }, [settings, decided]);

  if (decided) return null;

  const choose = (nextAnalytics, nextMarketing) => {
    saveConsent({ analytics: nextAnalytics, marketing: nextMarketing });
    setSettings(false);
  };

  return (
    <section className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <h2 id="cookie-title" ref={headingRef} tabIndex={-1}>Cookies e privacidade</h2>
      <p>
        Usamos armazenamento essencial para o carrinho e a encomenda funcionarem. Estatísticas e marketing só
        são ativados se aceitar. Pode mudar de ideias quando quiser em &ldquo;Gerir cookies&rdquo;, no rodapé.{' '}
        <Link to="/privacidade">Política de privacidade</Link>
      </p>
      {settings && (
        <fieldset className="cookie-options">
          <legend className="sr-only">Escolha as categorias</legend>
          <label><input type="checkbox" checked disabled /> <span><b>Essenciais</b> — carrinho, pedido e a sua escolha de cookies. Sempre ativos.</span></label>
          <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> <span><b>Estatísticas</b> — contam visitas e produtos vistos para melhorarmos a loja.</span></label>
          <label><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> <span><b>Marketing</b> — medir anúncios (Meta). Desativado por defeito.</span></label>
        </fieldset>
      )}
      <div className="cookie-actions">
        <button type="button" className="cookie-btn" onClick={() => choose(true, true)}>Aceitar</button>
        <button type="button" className="cookie-btn" onClick={() => choose(false, false)}>Recusar</button>
        {settings
          ? <button type="button" className="cookie-btn" onClick={() => choose(analytics, marketing)}>Guardar escolha</button>
          : <button type="button" className="cookie-btn" onClick={() => setSettings(true)}>Configurar</button>}
      </div>
    </section>
  );
}
