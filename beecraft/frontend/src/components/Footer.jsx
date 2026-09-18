import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div><div className="logo">Bee<span>craft</span></div><p>Papelaria personalizada feita à mão em Loulé, Algarve.</p></div>
        <div><h4>Loja</h4><ul><li><Link to="/agendas-planners">Agendas e planners</Link></li><li><Link to="/cadernos">Cadernos</Link></li><li><Link to="/imanes-acessorios">Ímanes e acessórios</Link></li><li><Link to="/brindes">Brindes</Link></li></ul></div>
        <div><h4>BeeCraft</h4><ul><li><Link to="/servicos">Serviços</Link></li><li><Link to="/#empresas">Para empresas</Link></li><li><Link to="/sobre-nos">Sobre nós</Link></li><li><Link to="/contactos">Contactos</Link></li><li><Link to="/blog">Blog</Link></li></ul></div>
        <div><h4>Ajuda e legal</h4><ul><li><Link to="/faq">Perguntas frequentes</Link></li><li><Link to="/metodos-pagamento">Métodos de pagamento</Link></li><li><Link to="/garantia-devolucoes">Garantia e devoluções</Link></li><li><Link to="/politica-privacidade">Privacidade</Link></li><li><Link to="/termos-condicoes">Termos e condições</Link></li><li><a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noreferrer">Livro de Reclamações</a></li></ul></div>
      </div>
      <div className="container copy"><span>© 2026 BeeCraft. Todos os direitos reservados.</span><span>Feito em Portugal</span></div>
    </footer>
  );
}
