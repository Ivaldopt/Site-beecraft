import { useId } from 'react';
import { Link } from 'react-router-dom';

/** Caixa obrigatória dos Termos (desmarcada) e, opcionalmente, a caixa de marketing (desmarcada, facultativa). */
export default function ConsentFields({ terms, onTerms, marketing, onMarketing, showMarketing = true }) {
  const id = useId();
  return (
    <>
      <label className="consent-check" htmlFor={`${id}-terms`}>
        <input id={`${id}-terms`} type="checkbox" checked={terms} onChange={(event) => onTerms(event.target.checked)} required />
        <span>Li e aceito os <Link to="/termos" target="_blank">Termos e condições</Link> e a <Link to="/privacidade" target="_blank">Política de privacidade</Link>. *</span>
      </label>
      {showMarketing && (
        <label className="consent-check" htmlFor={`${id}-marketing`}>
          <input id={`${id}-marketing`} type="checkbox" checked={marketing} onChange={(event) => onMarketing(event.target.checked)} />
          <span>(Opcional) Quero receber novidades e ofertas da BeeCraft por email e mensagem. Posso retirar o consentimento quando quiser. A encomenda funciona sem esta opção.</span>
        </label>
      )}
    </>
  );
}
