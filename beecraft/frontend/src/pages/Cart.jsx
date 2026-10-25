import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createWhatsappUrl } from '../components/WhatsappFab';
import api from '../api/client';
import { trackCatalogEvent } from '../utils/analytics';
import { deleteCartAttachment, getCartAttachment } from '../utils/cartAttachments';

const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');

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
    setCheckoutNotice('');
    setFallbackWhatsappUrl('');
    const attachmentItems = items.filter((item) => item.attachmentId);
    // Open synchronously from the submit gesture so popup blockers do not stop WhatsApp.
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
      const files = (await Promise.all(attachmentItems.map((item) => getCartAttachment(item.attachmentId).catch(() => null)))).filter(Boolean);
      if (files.length && navigator.share && navigator.canShare?.({ files })) {
        try {
          await navigator.share({
            title: `Encomenda ${order.orderNumber} · BeeCraft`,
            text: `${createVerifiedMessage(order)}\n\nPDF(s) da personalização anexado(s).`,
            files,
          });
          whatsappWindow?.close();
          await Promise.all(attachmentItems.map((item) => deleteCartAttachment(item.attachmentId)));
          clearCart();
          setCheckoutNotice('Pedido e PDF partilhados. Escolha o WhatsApp na janela de partilha para concluir.');
          return;
        } catch (shareError) {
          if (shareError?.name === 'AbortError') {
            whatsappWindow?.close();
            setCheckoutNotice('A partilha foi cancelada. O pedido continua no carrinho para tentar novamente.');
            return;
          }
        }
      }
      if (files.length) {
        files.forEach((file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        });
        setCheckoutNotice('O PDF foi descarregado. Anexe-o na conversa do WhatsApp que será aberta.');
        if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
        else setFallbackWhatsappUrl(whatsappUrl);
      } else if (attachmentItems.length) {
        setCheckoutNotice('Não encontrámos o PDF guardado. Gere-o novamente ou envie-o manualmente no WhatsApp.');
        if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
        else setFallbackWhatsappUrl(whatsappUrl);
      } else if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        setFallbackWhatsappUrl(whatsappUrl);
      }
      await Promise.all(attachmentItems.map((item) => deleteCartAttachment(item.attachmentId)));
      clearCart();
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

  async function handleRemove(item) {
    if (item.attachmentId) await deleteCartAttachment(item.attachmentId).catch(() => {});
    removeItem(item.cartItemId);
  }

  return (
    <main className="container cart-page">
      <div className="breadcrumb"><Link to="/">Início</Link> / Carrinho</div>
      <div className="section-head"><h2>O seu carrinho</h2></div>
      {!items.length ? (
        <div className="cart-empty-page">
          {fallbackWhatsappUrl || checkoutNotice ? (
            <>
              <p>{checkoutNotice || 'Pedido criado e validado com sucesso.'}</p>
              {fallbackWhatsappUrl && <a className="btn whatsapp-btn" href={fallbackWhatsappUrl} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>}
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
                      PDF pronto: {item.customizationFileName}
                    </p>
                  )}
                  {item.customizationText && <p>Texto: {item.customizationText}</p>}
                  {item.customizationTextColor && <p>Cor do texto: <span className="cart-color" style={{ background: item.customizationTextColor }} /> {item.customizationTextColor}</p>}
                  {Object.entries(item.customizationDetails ?? {}).filter(([, value]) => value).map(([key, value]) => <p key={key}><b>{{ orientation: 'Orientação', columns: 'Colunas', startMonth: 'Início', appointmentHours: 'Horário', coverInstructions: 'Capa', elasticColor: 'Elástico', coilColor: 'Espiral' }[key] || key}:</b> {value}</p>)}
                  <button
                    className="cart-delete-btn"
                    type="button"
                    onClick={() => handleRemove(item)}
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
              {checkoutNotice && <p className="checkout-notice" role="status">{checkoutNotice}</p>}
              <button className="btn whatsapp-btn btn-block" type="submit" disabled={submitting}>
                {submitting ? 'A preparar pedido e PDF...' : items.some((item) => item.attachmentId) ? 'Enviar pedido e PDF pelo WhatsApp' : 'Finalizar pelo WhatsApp'}
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
