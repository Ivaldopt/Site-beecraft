import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { createWhatsappUrl } from '../components/WhatsappFab';

const frequentlyAskedQuestions = [
  ['Como funciona a personalização?', 'Escolha o produto, selecione formato, capa, interior e acabamentos disponíveis. Nos produtos compatíveis, o resultado aparece no preview enquanto personaliza.'],
  ['Posso enviar uma fotografia ou logótipo?', 'Sim. Pode enviar ficheiros JPG, PNG ou WEBP diretamente na página do produto. Recomendamos uma imagem nítida e com boa resolução.'],
  ['O preview mostra exatamente o produto final?', 'O preview é uma representação aproximada da capa e dos acabamentos. Antes da produção, confirmamos consigo qualquer ajuste necessário na arte.'],
  ['Quanto tempo demora a produção?', 'O prazo depende do produto, da quantidade e da personalização. A estimativa é apresentada no produto e confirmada antes do pagamento.'],
  ['Quais são as formas de pagamento?', 'As formas disponíveis são confirmadas no atendimento, incluindo MB Way e transferência bancária. O pagamento só é combinado depois de revermos o pedido.'],
  ['Fazem envios?', 'Sim. Enviamos para Portugal e Espanha. O custo e a previsão de entrega são informados antes da confirmação da encomenda.'],
  ['Posso alterar o pedido depois de o enviar?', 'Pode pedir alterações enquanto a produção ainda não tiver começado. Depois dessa etapa, algumas alterações podem não ser possíveis.'],
  ['Produtos personalizados podem ser devolvidos?', 'Se existir defeito ou dano, fale connosco assim que receber a encomenda. Produtos feitos segundo escolhas do cliente podem estar abrangidos por exceções ao direito de livre resolução.'],
  ['Aceitam pedidos para empresas e eventos?', 'Sim. Produzimos agendas, cadernos, brindes e papelaria para equipas, clientes, casamentos e eventos. Preparamos um orçamento conforme produto, quantidade e prazo.'],
  ['Existe quantidade mínima?', 'Produtos individuais podem ser pedidos a partir de uma unidade. Para projetos empresariais ou eventos, a quantidade mínima depende do tipo de produto e é confirmada no orçamento.'],
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [company, setCompany] = useState({ name: '', contact: '', email: '', quantity: '', details: '' });
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products')])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data);
        setProducts(productResponse.data);
      })
      .catch(() => setError('Não foi possível carregar a loja.'))
      .finally(() => setLoading(false));
  }, []);

  const featured = products[0];
  const heroSlides = [
    { eyebrow: 'Agenda + planner combinada', title: 'O seu ano, organizado à sua maneira.', text: 'Uma peça artesanal com capa, interior, nome e fotografia escolhidos por si.', primary: 'Criar a minha', primaryTo: featured ? `/personalizar/${featured.slug}` : '/agendas-planners', secondary: 'Ver agendas', secondaryTo: '/agendas-planners', theme: 'agenda' },
    { eyebrow: 'A sua história na capa', title: 'Transforme uma fotografia numa peça única.', text: 'Envie a imagem, escolha os detalhes e acompanhe a personalização no preview em tempo real.', primary: 'Personalizar agora', primaryTo: featured ? `/personalizar/${featured.slug}` : '/loja', secondary: 'Como funciona', secondaryTo: '/faq', theme: 'photo' },
    { eyebrow: 'BeeCraft para empresas', title: 'Brindes personalizados que deixam marca.', text: 'Agendas, cadernos e conjuntos para equipas, clientes, eventos e datas especiais.', primary: 'Pedir orçamento', primaryTo: '/#empresas', secondary: 'Ver brindes', secondaryTo: '/brindes', theme: 'business' },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);
  function requestCompanyQuote(event) {
    event.preventDefault();
    const message = [
      'Olá! Gostaria de pedir um orçamento empresarial BeeCraft.',
      '',
      `Empresa: ${company.name.trim()}`,
      `Contacto: ${company.contact.trim()}`,
      `Email: ${company.email.trim()}`,
      `Quantidade estimada: ${company.quantity}`,
      `Pedido: ${company.details.trim()}`,
    ].join('\n');
    window.open(createWhatsappUrl(message), '_blank', 'noopener,noreferrer');
  }
  return (
    <main>
      <section className={`hero hero-carousel hero-${heroSlides[heroSlide].theme}`} aria-roledescription="carrossel" aria-label="Destaques BeeCraft">
        <div className="container hero-grid">
          <div className="hero-copy" key={heroSlide} aria-live="polite">
            <div className="eyebrow">{heroSlides[heroSlide].eyebrow}</div>
            <h1>{heroSlides[heroSlide].title}</h1>
            <p className="lead">{heroSlides[heroSlide].text}</p>
            <div className="btns">
              <Link className="btn primary" to={heroSlides[heroSlide].primaryTo}>{heroSlides[heroSlide].primary}</Link>
              <Link className="btn secondary" to={heroSlides[heroSlide].secondaryTo}>{heroSlides[heroSlide].secondary}</Link>
            </div>
            <div className="hero-note"><span>✓ Preview em tempo real</span><span>✓ Feita por encomenda</span><span>✓ Produzida em Loulé</span></div>
          </div>
          <div className="hero-showcase" aria-label="Agenda personalizada BeeCraft">
            <div className={`hero-visual visual-${heroSlides[heroSlide].theme}`} key={heroSlides[heroSlide].theme}>
              <div className="hero-book"><span>BeeCraft</span><strong>{heroSlides[heroSlide].theme === 'business' ? 'A sua marca' : heroSlides[heroSlide].theme === 'photo' ? 'A sua memória' : 'A minha agenda'}</strong><small>{heroSlides[heroSlide].theme === 'business' ? 'BRINDES EMPRESARIAIS' : heroSlides[heroSlide].theme === 'photo' ? 'CAPA PERSONALIZADA' : 'AGENDA + PLANNER'}</small></div>
              <div className="hero-sticker">Feito<br />para si</div>
            </div>
          </div>
        </div>
        <div className="container hero-controls">
          <div>{heroSlides.map((slide, index) => <button type="button" key={slide.theme} className={heroSlide === index ? 'active' : ''} onClick={() => setHeroSlide(index)} aria-label={`Mostrar banner ${index + 1}`} aria-current={heroSlide === index ? 'true' : undefined} />)}</div>
        </div>
      </section>

      <section className="trust"><div className="container trust-row">
        <div className="trust-item">Feito à mão<span>Produção local em Loulé</span></div>
        <div className="trust-item">Personalização total<span>Nome, tema, cor e fotografia</span></div>
        <div className="trust-item">Materiais escolhidos<span>Acabamento cuidado em cada peça</span></div>
        <div className="trust-item">Prazo transparente<span>Confirmado antes do pagamento</span></div>
      </div></section>

      {error && <div className="container form-error home-error">{error}</div>}

      <section className="home-services"><div className="container">
        <div className="section-head"><div><div className="eyebrow">Tudo o que criamos</div><h2>Serviços para momentos e marcas</h2></div><Link className="link" to="/servicos">Conhecer todos os serviços</Link></div>
        <div className="home-service-grid">
          <Link to="/servicos/agendas-organizacao"><span>01</span><h3>Agendas & organização</h3><p>Agendas, planners, cadernos e blocos.</p></Link>
          <Link to="/servicos/albuns-memorias"><span>02</span><h3>Álbuns & memórias</h3><p>Álbuns personalizados para cada história.</p></Link>
          <Link to="/servicos/papelaria-infantil"><span>03</span><h3>Papelaria infantil</h3><p>Livros, atividades, etiquetas e lembranças.</p></Link>
          <Link to="/servicos/eventos"><span>04</span><h3>Papelaria para eventos</h3><p>Convites, menus, brindes e materiais personalizados.</p></Link>
        </div>
      </div></section>

      <section className="home-works-cta"><div className="container home-works-cta-inner"><div><div className="eyebrow">Novo na BeeCraft</div><h2>Kits completos para o seu negócio</h2><p>Cartões, menus, vouchers, ímanes e materiais de marca reunidos num único pedido personalizável.</p></div><Link className="btn primary" to="/nossos-trabalhos">Conhecer nossos trabalhos</Link></div></section>

      <section id="categorias"><div className="container">
        <div className="section-head"><div><div className="eyebrow">Encontre a sua peça</div><h2>Comprar por categoria</h2></div><p>Comece pelo tipo de produto e personalize os detalhes depois.</p></div>
        <div className="categories">{categories.map((category) => <Link key={category.id} className="cat" to={`/loja?categoria=${category.slug}`}><strong>{category.name}</strong><span>{category._count?.products ?? 0} produto(s)</span></Link>)}</div>
      </div></section>

      <section id="produtos" className="featured-products"><div className="container">
        <div className="section-head"><div><div className="eyebrow">Escolhas BeeCraft</div><h2>Mais personalizados</h2></div><Link className="link" to="/loja">Ver todos os produtos</Link></div>
        {loading ? <p>A carregar produtos...</p> : <div className="products">{products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </div></section>

      <section className="process-section"><div className="container">
        <div className="section-head"><div><div className="eyebrow">Simples e especial</div><h2>Da sua ideia para as suas mãos</h2></div></div>
        <div className="steps"><article className="step"><i>1</i><h3>Escolha</h3><p>Selecione o produto e o formato.</p></article><article className="step"><i>2</i><h3>Personalize</h3><p>Defina capa, interior, nome e foto.</p></article><article className="step"><i>3</i><h3>Veja</h3><p>Acompanhe o resultado no preview.</p></article><article className="step"><i>4</i><h3>Confirme</h3><p>Revise todos os detalhes no carrinho.</p></article><article className="step"><i>5</i><h3>Receba</h3><p>Nós produzimos e enviamos com cuidado.</p></article></div>
      </div></section>

      <section className="b2b" id="empresas"><div className="container b2b-grid">
        <div>
          <div className="eyebrow">BeeCraft para empresas</div>
          <h2>Brindes que levam a sua marca mais longe.</h2>
          <p>Produzimos agendas, cadernos e conjuntos personalizados para equipas, clientes, eventos e datas especiais.</p>
          <div className="b2b-list"><div>Logótipo e identidade visual</div><div>Pedidos em quantidade</div><div>Orçamento personalizado</div><div>Acompanhamento direto</div></div>
        </div>
        <form className="b2b-form" onSubmit={requestCompanyQuote}>
          <div className="form-grid">
            <div className="field"><label htmlFor="company-name">Empresa *</label><input id="company-name" required minLength="2" maxLength="120" value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} /></div>
            <div className="field"><label htmlFor="company-contact">Nome de contacto *</label><input id="company-contact" required minLength="2" maxLength="100" autoComplete="name" value={company.contact} onChange={(event) => setCompany({ ...company, contact: event.target.value })} /></div>
            <div className="field"><label htmlFor="company-email">Email *</label><input id="company-email" required type="email" maxLength="254" autoComplete="email" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} /></div>
            <div className="field"><label htmlFor="company-quantity">Quantidade estimada *</label><input id="company-quantity" required type="number" min="5" max="10000" value={company.quantity} onChange={(event) => setCompany({ ...company, quantity: event.target.value })} /></div>
            <div className="field full"><label htmlFor="company-details">O que pretende personalizar? *</label><textarea id="company-details" required minLength="10" maxLength="1000" rows="5" placeholder="Produto, data pretendida, cores e outros detalhes..." value={company.details} onChange={(event) => setCompany({ ...company, details: event.target.value })} /></div>
          </div>
          <button className="btn primary btn-block" type="submit">Pedir orçamento pelo WhatsApp</button>
          <p className="b2b-privacy">Usaremos estes dados apenas para responder ao seu pedido.</p>
        </form>
      </div></section>

      <section className="home-faq" id="perguntas-frequentes"><div className="container home-faq-grid">
        <div className="home-faq-intro">
          <div className="eyebrow">Estamos aqui para ajudar</div>
          <h2>Perguntas frequentes</h2>
          <p>Encontre respostas sobre personalização, encomendas, pagamento e entrega.</p>
          <div className="faq-help"><strong>Ainda tem uma dúvida?</strong><span>Fale diretamente connosco e ajudamos a preparar o seu pedido.</span><a className="btn secondary" href={createWhatsappUrl('Olá! Tenho uma dúvida sobre os produtos e serviços BeeCraft.')} target="_blank" rel="noreferrer">Perguntar no WhatsApp</a></div>
        </div>
        <div className="faq-accordion">
          {frequentlyAskedQuestions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><b>+</b></summary><p>{answer}</p></details>)}
        </div>
      </div></section>

      <section className="newsletter"><div className="container newsletter-inner"><div><div className="eyebrow">Novidades BeeCraft</div><h2>Inspiração no seu email</h2><p>Receba novidades e uma oferta para a primeira compra.</p></div>{subscribed ? <strong>Obrigada! O seu interesse ficou registado.</strong> : <form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}><label className="sr-only" htmlFor="newsletter-email">Email</label><input id="newsletter-email" type="email" required placeholder="O seu melhor email" /><button className="btn primary">Quero receber</button></form>}</div></section>
    </main>
  );
}
