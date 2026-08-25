export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="logo">Bee<span>craft</span></div>
          <p>Papelaria personalizada feita à mão em Loulé, Algarve.</p>
        </div>
        <div>
          <h4>Loja</h4>
          <ul>
            <li><a href="/loja">Agendas</a></li>
            <li><a href="/loja">Planners</a></li>
            <li><a href="/loja">Cadernos</a></li>
          </ul>
        </div>
        <div>
          <h4>Empresa</h4>
          <ul>
            <li><a href="#empresas">Para empresas</a></li>
            <li><a href="#">Quem somos</a></li>
          </ul>
        </div>
        <div>
          <h4>Ajuda</h4>
          <ul>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Envios</a></li>
          </ul>
        </div>
      </div>
      <div className="container copy">
        <span>© 2026 BeeCraft. Todos os direitos reservados.</span>
        <span>Feito em Portugal</span>
      </div>
    </footer>
  );
}
