import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const image = product.images?.[0];

  return (
    <div className="card">
      <div className="card-img">
        {image ? (
          <img src={image.url} alt={image.alt ?? product.name} />
        ) : (
          <div className="fake-product" style={{ background: 'var(--terracotta)' }}>
            {product.name}
          </div>
        )}
        <button className="fav-toggle" aria-label="Favoritar">
          <svg viewBox="0 0 24 24">
            <path d="M12 21s-7-4.5-9.5-9C.8 8.2 2.5 4 6.5 4 9 4 11 5.7 12 7.3 13 5.7 15 4 17.5 4 21.5 4 23.2 8.2 21.5 12 19 16.5 12 21 12 21z" />
          </svg>
        </button>
      </div>

      <div className="card-body">
        <h3>{product.name}</h3>
        <div className="price">€{Number(product.basePrice).toFixed(2)}</div>
        <Link className="btn primary btn-block" to={`/produto/${product.slug}`}>
          Personalizar
        </Link>
      </div>
    </div>
  );
}
