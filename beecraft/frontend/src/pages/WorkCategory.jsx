import { Link, Navigate, useParams } from 'react-router-dom';
import { workCategories } from '../data/worksCatalog';

export default function WorkCategory() {
  const { categorySlug } = useParams();
  const category = workCategories[categorySlug];
  if (!category) return <Navigate to="/nossos-trabalhos" replace />;
  return <main className="work-category-page">
    <section className="work-category-hero"><img src={category.image} alt={`Coleção BeeCraft para ${category.title}`} /><div className="container"><div className="eyebrow">{category.eyebrow}</div><h1>{category.title}</h1><p>{category.description}</p><a className="btn primary" href="#produtos">Ver produtos</a></div></section>
    <section className="container work-category-intro"><div className="breadcrumb"><Link to="/">Início</Link> / <Link to="/nossos-trabalhos">Nossos trabalhos</Link> / {category.title}</div><div className="section-head"><div><div className="eyebrow">Escolha e personalize</div><h2>Produtos para {category.title.toLowerCase()}</h2></div><p>Selecione uma peça para escolher formato, quantidade, acabamento e enviar a sua arte.</p></div>
      <div className="work-product-grid" id="produtos">{category.products.map(([slug, name, price, description], index) => <article key={slug}><Link to={`/personalizar/${slug}`}><div className="work-product-photo"><img src={category.image} alt={`Mockup de ${name}`} style={{ objectPosition: `${62 + (index % 3) * 10}% ${35 + (index % 2) * 35}%` }} /><span>{String(index + 1).padStart(2, '0')}</span></div><div className="work-product-copy"><h3>{name}</h3><p>{description}</p><b>{price}</b><strong>Personalizar →</strong></div></Link></article>)}</div>
    </section>
    <section className="work-help"><div className="container"><div><div className="eyebrow">Não tem uma arte pronta?</div><h2>Nós ajudamos a criar.</h2><p>Escolha “Preciso de design” durante a personalização e descreva a sua ideia.</p></div><Link className="btn secondary" to="/personalizar/servico-design-grafico">Conhecer o serviço de design</Link></div></section>
  </main>;
}
