import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <>
      <div className="topbar">
        Personalização artesanal · Produzido em Loulé, Algarve · Envio para Portugal e Espanha
      </div>

      <header>
        <div className="container nav">
          <Link className="logo" to="/">
            
            Bee<span>craft</span>
          </Link>

          <nav className="menu">
            <Link to="/loja">Loja</Link>
            <a href="#personalizar">Personalize</a>
            <a href="#colecoes">Coleções</a>
            <a href="#empresas">Para empresas</a>
          </nav>

          <div className="actions">
            <button className="icon" aria-label="Pesquisar">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
            <button className="icon" aria-label="Favoritos">
              <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.8 8.2 2.5 4 6.5 4 9 4 11 5.7 12 7.3 13 5.7 15 4 17.5 4 21.5 4 23.2 8.2 21.5 12 19 16.5 12 21 12 21z" /></svg>
              <b>0</b>
            </button>
            <Link className="icon" to="/carrinho" aria-label="Carrinho">
              <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /><path d="M2 3h2l2.4 12.2A2 2 0 0 0 8.4 17H18a2 2 0 0 0 2-1.6L21.6 7H6" /></svg>
              <b>{totalItems}</b>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
