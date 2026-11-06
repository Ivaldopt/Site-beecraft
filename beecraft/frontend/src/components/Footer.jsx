import { Link } from 'react-router-dom';
import { company } from '../config/company';
import { OPEN_COOKIE_SETTINGS } from '../consent/CookieBanner';

export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div><div className="logo">Bee<span>craft</span></div><p>Papelaria personalizada feita à mão em Loulé, Algarve.</p></div>
        <div><h2>Loja</h2><ul><li><Link to="/agendas-planners">Agendas e planners</Link></li><li><Link to="/cadernos">Cadernos</Link></li><li><Link to="/imanes-acessorios">Ímanes e acessórios</Link></li><li><Link to="/brindes">Brindes</Link></li></ul></div>
        <div><h2>BeeCraft</h2><ul><li><Link to="/servicos">Serviços</Link></li><li><Link to="/#empresas">Para empresas</Link></li><li><Link to="/sobre-nos">Sobre nós</Link></li><li><Link to="/contactos">Contactos</Link></li><li><Link to="/blog">Blog</Link></li></ul></div>
        <div><h2>Ajuda e legal</h2><ul><li><Link to="/faq">Perguntas frequentes</Link></li><li><Link to="/metodos-pagamento">Métodos de pagamento</Link></li><li><Link to="/garantia-devolucoes">Garantia e devoluções</Link></li><li><Link to="/privacidade">Privacidade</Link></li><li><Link to="/termos">Termos e condições</Link></li><li><a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noreferrer">Livro de Reclamações</a></li></ul></div>
      </div>
      <div className="container copy"><span>© 2026 {company.legalName || company.name}{company.nif ? ` · NIF ${company.nif}` : ''} · {company.address}</span><span>
          {company.email && <a href={`mailto:${company.email}`}>{company.email}</a>}
          {company.email && company.phone ? ' · ' : ''}
          {company.phone && <a href={company.phoneHref}>{company.phone}</a>}
          {' · '}<button type="button" className="cookie-link-btn" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>Gerir cookies</button>
        </span></div>
    </footer>
  );
}
