import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import eventsImage from '../assets/services/eventos.jpg';

export default function Header() {
  const { totalItems } = useCart();
  const [worksOpen, setWorksOpen] = useState(false);
  const closeMenu = () => setWorksOpen(false);
  return <><div className="topbar">Personalização artesanal · Produzido em Loulé, Algarve · Envio para Portugal e Espanha</div><header className="site-header"><div className="container nav">
    <Link className="logo" to="/">Bee<span>craft</span></Link>
    <nav className="menu" aria-label="Navegação principal">
      <NavLink to="/agendas-planners">Agendas e planners</NavLink><NavLink to="/cadernos">Cadernos</NavLink><NavLink to="/imanes-acessorios">Ímanes</NavLink>
      <div className={`services-menu ${worksOpen ? 'open' : ''}`} onMouseEnter={() => setWorksOpen(true)} onMouseLeave={closeMenu} onFocus={() => setWorksOpen(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }} onKeyDown={(event) => { if (event.key === 'Escape') closeMenu(); }}>
        <NavLink to="/nossos-trabalhos" className="services-trigger" onClick={closeMenu} aria-expanded={worksOpen}>Nossos trabalhos <span>⌄</span></NavLink>
        <div className="mega-menu works-mega-menu" aria-hidden={!worksOpen}><div className="mega-menu-head"><div><small>Explore e personalize</small><strong>Tudo o que a BeeCraft faz</strong></div><Link to="/nossos-trabalhos" onClick={closeMenu}>Ver todos →</Link></div>
          <div className="works-mega-grid"><div><h3>Comprar por área</h3><Link to="/trabalhos/comercio-local" onClick={closeMenu}>Comércio Local</Link><Link to="/trabalhos/restauracao-hotelaria" onClick={closeMenu}>Restauração & Hotelaria</Link><Link to="/trabalhos/eventos" onClick={closeMenu}>Eventos</Link><Link to="/trabalhos/empresas" onClick={closeMenu}>Empresas</Link></div><div><h3>Mais procurados</h3><Link to="/personalizar/cartao-de-visita" onClick={closeMenu}>Cartões de visita</Link><Link to="/personalizar/flyer-personalizado" onClick={closeMenu}>Flyers</Link><Link to="/personalizar/menu-personalizado" onClick={closeMenu}>Menus</Link><Link to="/personalizar/etiqueta-agradecimento" onClick={closeMenu}>Etiquetas</Link></div><div><h3>Serviços criativos</h3><Link to="/personalizar/servico-design-grafico" onClick={closeMenu}>Design gráfico</Link><Link to="/personalizar/criacao-de-site" onClick={closeMenu}>Criação de sites</Link><Link to="/servicos" onClick={closeMenu}>Todos os serviços</Link></div><Link className="works-mega-feature" to="/nossos-trabalhos" onClick={closeMenu}><img src={eventsImage} alt="Projetos personalizados BeeCraft" /><span><b>Da ideia ao produto final</b><small>Soluções para marcas e momentos.</small></span></Link></div>
        </div>
      </div><Link to="/#empresas">Para empresas</Link><NavLink to="/sobre-nos">Sobre nós</NavLink>
    </nav>
    <div className="actions"><Link className="icon" to="/loja" aria-label="Pesquisar produtos"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></Link><Link className="icon" to="/carrinho" aria-label={`Carrinho com ${totalItems} artigos`}><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /><path d="M2 3h2l2.4 12.2A2 2 0 0 0 8.4 17H18a2 2 0 0 0 2-1.6L21.6 7H6" /></svg><b>{totalItems}</b></Link></div>
  </div></header></>;
}
