import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createWhatsappUrl } from '../components/WhatsappFab';

const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const message = [
    'Olá! Gostaria de fazer este pedido na BeeCraft:',
    '',
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.productName}${item.variantName ? ` — ${item.variantName}` : ''}`,
      ...(item.optionsSummary ?? []).map((option) => `   • ${option}`),
      ...(item.customizationFileName
        ? [`   • Ficheiro a enviar na conversa: ${item.customizationFileName}`]
        : []),
      ...(item.customizationText ? [`   • Texto personalizado: ${item.customizationText}`] : []),
      `   Quantidade: ${item.quantity} | Unitário: ${money(item.unitPrice)} | Subtotal: ${money(item.unitPrice * item.quantity)}`,
      '',
    ]),
    `Total: ${money(totalPrice)}`,
    '',
    'Podem confirmar a disponibilidade e os dados para entrega?',
  ].join('\n');

  return (
    <main className="container cart-page">
      <div className="breadcrumb"><Link to="/">Início</Link> / Carrinho</div>
      <div className="section-head"><h2>O seu carrinho</h2></div>
      {!items.length ? (
        <div className="cart-empty-page">
          <p>Ainda não adicionou nenhum produto.</p>
          <Link className="btn primary" to="/">Ver produtos</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-row" key={item.cartItemId}>
                <div className="cart-row-image">
                  {item.image ? <img src={item.image} alt="" /> : <span>{item.productName.slice(0, 1)}</span>}
                </div>
                <div className="cart-row-info">
                  <Link to={`/produto/${item.productSlug}`}><h3>{item.productName}</h3></Link>
                  {item.variantName && <p>{item.variantName}</p>}
                  {(item.optionsSummary ?? []).map((option) => <p key={option}>{option}</p>)}
                  {item.customizationFileName && (
                    <p className="cart-file-note">
                      Ficheiro: {item.customizationFileName} (enviar no WhatsApp)
                    </p>
                  )}
                  {item.customizationText && <p>Texto: {item.customizationText}</p>}
                  <button
                    className="cart-delete-btn"
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    aria-label={`Excluir ${item.productName} do carrinho`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" />
                    </svg>
                    Excluir produto
                  </button>
                </div>
                <div className="qty-stepper">
                  <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>&minus;</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                </div>
                <strong>{money(item.unitPrice * item.quantity)}</strong>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h3>Resumo</h3>
            <div><span>Subtotal</span><strong>{money(totalPrice)}</strong></div>
            <p>Envio e prazo de produção serão confirmados no WhatsApp.</p>
            <a className="btn whatsapp-btn btn-block" href={createWhatsappUrl(message)} target="_blank" rel="noreferrer">
              Finalizar pelo WhatsApp
            </a>
          </aside>
        </div>
      )}
    </main>
  );
}
