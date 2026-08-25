import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products')])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data);
        setProducts(prodRes.data);
      })
      .catch(() => setError('Não foi possível carregar a loja.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Papelaria personalizada</div>
            <h1>Papelaria feita para ser só sua.</h1>
            <p className="lead">
              Agendas, planners, cadernos e ímãs personalizados. Escolha, personalize
              no configurador e nós produzimos com cuidado, em Loulé.
            </p>
            <div className="btns">
              <a className="btn primary" href="#categorias">Ver coleção</a>
              <a className="btn secondary" href="#personalizar">Personalizar agora</a>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container" style={{ padding: '20px 0', color: 'var(--terracotta)' }}>
          {error}
        </div>
      )}

      <section id="categorias">
        <div className="container">
          <div className="section-head">
            <h2>Compre por categoria</h2>
            <p>Cada categoria tem o seu próprio universo de personalização.</p>
          </div>

          <div className="categories">
            {categories.map((cat) => (
              <Link key={cat.id} className="cat" to={`/loja?categoria=${cat.slug}`}>
                <strong>{cat.name}</strong>
                <span>{cat._count?.products ?? 0} produtos</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="produtos">
        <div className="container">
          <div className="section-head">
            <h2>Mais vendidos</h2>
            <p>Os produtos que os nossos clientes mais personalizam.</p>
            <Link className="link" to="/loja">Ver tudo</Link>
          </div>

          {loading ? (
            <p>A carregar produtos...</p>
          ) : (
            <div className="products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
