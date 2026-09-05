import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems } = useCart();
  return (
    <>
      <div className="topbar">Personalização artesanal · Produzido em Loulé, Algarve · Envio para Portugal e Espanha</div>
      <header>
        <div className="container nav">
          <Link className="logo" to="/">Bee<span>craft</span></Link>
          <nav className="menu" aria-label="Navegação principal">
            <NavLink to="/agendas-planners">Agendas e planners</NavLink>
            <NavLink to="/cadernos">Cadernos</NavLink>
            <NavLink to="/imanes-acessorios">Ímanes e acessórios</NavLink>
            <NavLink to="/brindes">Brindes</NavLink>
            <Link to="/#empresas">Para empresas</Link>
            <NavLink to="/sobre-nos">Sobre nós</NavLink>
          </nav>
          <div className="actions">
            <Link className="icon" to="/loja" aria-label="Pesquisar produtos"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></Link>
            <Link className="icon" to="/carrinho" aria-label={`Carrinho com ${totalItems} artigos`}><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /><path d="M2 3h2l2.4 12.2A2 2 0 0 0 8.4 17H18a2 2 0 0 0 2-1.6L21.6 7H6" /></svg><b>{totalItems}</b></Link>
          </div>
        </div>
      </header>
    </>
  );
}
