import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  const price = Number(product.basePrice).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  const customizable = product.saleType !== 'READY_MADE';
  return (
    <article className="card">
      <Link className="card-img" to={`/produto/${product.slug}`}>
        <span className={`product-type-badge ${customizable ? 'custom' : 'ready'}`}>{customizable ? 'Personalizável' : 'Pronto a comprar'}</span>
        {image ? <img src={image.url} alt={image.alt ?? product.name} loading="lazy" decoding="async" /> : <div className="fake-product" style={{ background: 'var(--terracotta)' }}>{product.name}</div>}
      </Link>
      <div className="card-body"><h3>{product.name}</h3><div className="price">{customizable ? 'Desde ' : ''}{price}</div><Link className="btn primary btn-block" to={customizable ? `/personalizar/${product.slug}` : `/produto/${product.slug}`}>{customizable ? 'Personalizar' : 'Comprar agora'}</Link></div>
    </article>
  );
}
