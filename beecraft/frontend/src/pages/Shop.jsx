import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import magnetsHero from '../assets/magnets-hero.jpg';

export default function Shop({ categoryOverride = '', title = 'Loja BeeCraft', hero = '' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = categoryOverride || searchParams.get('categoria') || '';
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/categories'),
      api.get('/products', { params: category ? { category } : undefined }),
    ])
      .then(([categoriesResponse, productsResponse]) => {
        if (!active) return;
        setError('');
        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os produtos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [category]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-PT');
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      `${product.name} ${product.shortDesc ?? ''}`
        .toLocaleLowerCase('pt-PT')
        .includes(normalizedQuery),
    );
  }, [products, query]);

  function selectCategory(event) {
    const nextCategory = event.target.value;
    setLoading(true);
    setError('');
    if (!categoryOverride) setSearchParams(nextCategory ? { categoria: nextCategory } : {});
  }

  return (
    <main className="shop-page">
      {hero === 'magnets' && <section className="magnets-shop-hero"><img src={magnetsHero} alt="Íman personalizado BeeCraft em azul pastel" /><div className="container magnets-shop-hero-content"><div className="eyebrow">Ímanes personalizados</div><h1>Pequenos detalhes.<br />Grandes memórias.</h1><p>Transforme fotografias, mensagens e marcas em peças únicas.</p><div className="magnet-hero-actions"><Link className="btn primary" to="/montador-imas">Montar os meus ímanes</Link><Link className="btn secondary" to="/personalizar/iman-button-personalizado">Personalização simples</Link></div></div></section>}
      <div className="container">
        <div className="breadcrumb"><Link to="/">Início</Link> / Loja</div>
        <div className="shop-heading">
          <div>
            <div className="eyebrow">Papelaria personalizada</div>
            {hero ? <h2>{title}</h2> : <h1>{title}</h1>}
            <p>Escolha uma peça e personalize cada detalhe.</p>
          </div>
          <div className="shop-controls" role="search">
            <div className="field">
              <label htmlFor="shop-search">Pesquisar</label>
              <input id="shop-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Agenda, planner, caderno..." />
            </div>
            <div className="field">
              <label htmlFor="shop-category">Categoria</label>
              <select id="shop-category" value={category} onChange={selectCategory} disabled={Boolean(categoryOverride)}>
                <option value="">Todas as categorias</option>
                {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="shop-results-meta" aria-live="polite">
          {!loading && !error && `${visibleProducts.length} produto${visibleProducts.length === 1 ? '' : 's'}`}
        </div>
        {loading && <div className="page-state">A carregar produtos...</div>}
        {error && <div className="shop-empty" role="alert"><p>{error}</p><button className="btn secondary" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="products shop-products">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className="shop-empty">
            <h2>Nenhum produto encontrado</h2>
            <p>Tente outra pesquisa ou remova o filtro de categoria.</p>
            <button className="btn secondary" onClick={() => { setQuery(''); setSearchParams({}); }}>Limpar filtros</button>
          </div>
        )}
      </div>
    </main>
  );
}
