import { Link } from 'react-router-dom';
import { workCategories } from '../data/worksCatalog';

const kits = [
  { slug: 'kit-comercio-local', category: 'comercio-local', title: 'Kit Comércio Local', text: 'Cartões, flyers, fidelização, voucher, íman e agradecimento.', price: '49 €' },
  { slug: 'kit-restauracao-hotelaria', category: 'restauracao-hotelaria', title: 'Kit Restauração & Hotelaria', text: 'Menu, cartão de mesa, voucher, etiquetas e bloco personalizado.', price: '59 €' },
  { slug: 'kit-eventos', category: 'eventos', title: 'Kit Eventos', text: 'Convite, menu, marcador, etiqueta, lembrança e encadernação.', price: '65 €' },
  { slug: 'kit-empresas', category: 'empresas', title: 'Kit Empresas', text: 'Apresentação, bloco, cartões, onboarding e material promocional.', price: '79 €' },
];

export default function Works() {
  return <main className="works-page">
    <section className="works-hero"><div className="container"><div className="eyebrow">Tudo para a sua marca</div><h1>Os nossos trabalhos,<br />feitos à sua maneira.</h1><p>Escolha um produto, personalize online e envie o pedido sem sair do site.</p><a className="btn primary" href="#kits">Ver kits profissionais</a></div></section>
    <section className="container works-categories"><div className="section-head"><div><div className="eyebrow">Comece por aqui</div><h2>O que quer criar?</h2></div></div><div className="works-category-grid">
      <Link to="/trabalhos/comercio-local"><span>01</span><strong>Comércio local</strong><small>Cartões, flyers e fidelização</small></Link><Link to="/trabalhos/restauracao-hotelaria"><span>02</span><strong>Restauração & Hotelaria</strong><small>Menus, mesa e embalagens</small></Link><Link to="/trabalhos/eventos"><span>03</span><strong>Eventos</strong><small>Convites, menus e lembranças</small></Link><Link to="/trabalhos/empresas"><span>04</span><strong>Empresas</strong><small>Apresentações, equipas e campanhas</small></Link>
    </div></section>
    <section className="works-kits" id="kits"><div className="container"><div className="section-head"><div><div className="eyebrow">Soluções completas</div><h2>Kits para negócios e eventos</h2><p>Conjuntos pensados para comunicar de forma consistente.</p></div></div><div className="kit-grid">{kits.map((kit) => <article key={kit.slug}><Link to={`/personalizar/${kit.slug}`}><img src={workCategories[kit.category].image} alt="" /><div><small>Desde {kit.price}</small><h3>{kit.title}</h3><p>{kit.text}</p><strong>Personalizar kit →</strong></div></Link></article>)}</div></div></section>
    <section className="container creative-services"><div className="creative-copy"><div className="eyebrow">Também damos forma à ideia</div><h2>Design e presença digital</h2><p>Se ainda não tem uma identidade visual ou precisa de um site, a BeeCraft acompanha o projeto do conceito à entrega.</p></div><div className="creative-cards"><Link to="/personalizar/servico-design-grafico"><b>Design gráfico</b><span>Logótipo, identidade visual, redes sociais e materiais impressos.</span><strong>Começar projeto →</strong></Link><Link to="/personalizar/criacao-de-site"><b>Criação de sites</b><span>Landing pages, sites institucionais e lojas online.</span><strong>Pedir proposta →</strong></Link></div></section>
  </main>;
}
