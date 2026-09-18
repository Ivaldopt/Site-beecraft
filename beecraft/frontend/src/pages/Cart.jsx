import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createWhatsappUrl } from '../components/WhatsappFab';
import api from '../api/client';
import { trackCatalogEvent } from '../utils/analytics';

const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState('');

  function updateCustomer(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function createVerifiedMessage(order) {
    return [
      `Olá! Gostaria de confirmar o pedido ${order.orderNumber}:`,
      '',
      ...order.items.flatMap((item, index) => [
        `${index + 1}. ${item.productName}${item.variantName ? ` — ${item.variantName}` : ''}`,
        ...item.options.map((option) => `   • ${option.name}`),
        ...(item.customizationText ? [`   • Texto: ${item.customizationText}`] : []),
        ...(item.customizationTextColor ? [`   • Cor do texto: ${item.customizationTextColor}`] : []),
        ...Object.entries(item.customizationDetails ?? {}).filter(([, value]) => value).map(([key, value]) => `   • ${{ orientation: 'Orientação', columns: 'Nº de colunas', startMonth: 'Início', appointmentHours: 'Horário', coverInstructions: 'Capa', elasticColor: 'Elástico', coilColor: 'Espiral' }[key] || key}: ${value}`),
        ...(item.customizationFileName
          ? [`   • Ficheiro a enviar: ${item.customizationFileName}`]
          : []),
        `   Quantidade: ${item.quantity} | Subtotal: ${money(item.total)}`,
        '',
      ]),
      `Total validado: ${money(order.total)}`,
      '',
      'Podem confirmar o prazo de produção e os dados para entrega?',
    ].join('\n');
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setSubmitting(true);
    setCheckoutError('');
    setFallbackWhatsappUrl('');
    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) whatsappWindow.opener = null;

    try {
      const { data: order } = await api.post('/orders', {
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim() || undefined,
        },
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          optionValueIds: item.optionValueIds ?? [],
          quantity: item.quantity,
          customizationText: item.customizationText || undefined,
          customizationTextColor: item.customizationTextColor || undefined,
          customizationDetails: item.customizationDetails || undefined,
          customizationFileName: item.customizationFileName || undefined,
        })),
      });
      const whatsappUrl = createWhatsappUrl(createVerifiedMessage(order));
      trackCatalogEvent('WHATSAPP_CLICK');
      clearCart();
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        setFallbackWhatsappUrl(whatsappUrl);
      }
    } catch (requestError) {
      whatsappWindow?.close();
      const message = requestError.response?.data?.message;
      setCheckoutError(
        Array.isArray(message)
          ? message.join(' ')
          : message ?? 'Não foi possível validar o pedido. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container cart-page">
      <div className="breadcrumb"><Link to="/">Início</Link> / Carrinho</div>
      <div className="section-head"><h2>O seu carrinho</h2></div>
      {!items.length ? (
        <div className="cart-empty-page">
          {fallbackWhatsappUrl ? (
            <>
              <p>Pedido criado e validado com sucesso.</p>
              <a className="btn whatsapp-btn" href={fallbackWhatsappUrl} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>
            </>
          ) : (
            <>
              <p>Ainda não adicionou nenhum produto.</p>
              <Link className="btn primary" to="/">Ver produtos</Link>
            </>
          )}
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
                  {item.customizationTextColor && <p>Cor do texto: <span className="cart-color" style={{ background: item.customizationTextColor }} /> {item.customizationTextColor}</p>}
                  {Object.entries(item.customizationDetails ?? {}).filter(([, value]) => value).map(([key, value]) => <p key={key}><b>{{ orientation: 'Orientação', columns: 'Colunas', startMonth: 'Início', appointmentHours: 'Horário', coverInstructions: 'Capa', elasticColor: 'Elástico', coilColor: 'Espiral' }[key] || key}:</b> {value}</p>)}
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
            <form className="checkout-form" onSubmit={handleCheckout}>
              <div className="field">
                <label htmlFor="checkout-name">Nome *</label>
                <input id="checkout-name" name="name" value={customer.name} onChange={updateCustomer} minLength="2" maxLength="100" autoComplete="name" required />
              </div>
              <div className="field">
                <label htmlFor="checkout-email">Email *</label>
                <input id="checkout-email" name="email" type="email" value={customer.email} onChange={updateCustomer} maxLength="254" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="checkout-phone">Telefone</label>
                <input id="checkout-phone" name="phone" type="tel" value={customer.phone} onChange={updateCustomer} pattern="\+?[0-9 ]{9,20}" autoComplete="tel" placeholder="+351 912 345 678" />
              </div>
              {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
              <button className="btn whatsapp-btn btn-block" type="submit" disabled={submitting}>
                {submitting ? 'A validar pedido...' : 'Finalizar pelo WhatsApp'}
              </button>
              {fallbackWhatsappUrl && (
                <a className="checkout-fallback" href={fallbackWhatsappUrl} target="_blank" rel="noreferrer">
                  Pedido criado. Abrir WhatsApp
                </a>
              )}
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
