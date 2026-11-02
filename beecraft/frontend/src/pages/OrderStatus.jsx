import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { createWhatsappUrl } from '../components/WhatsappFab';
import { trackCatalogEvent } from '../utils/analytics';
import { deleteCartAttachment, getCartAttachment } from '../utils/cartAttachments';
import { clearPendingOrder, createOrderMessage, money, readPendingOrder } from '../utils/orderMessage';

const POLL_MS = 3000;
const GIVE_UP_MS = 12 * 60 * 1000;
const REDIRECT_SECONDS = 4;

export default function OrderStatus() {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [pending] = useState(() => readPendingOrder(orderId));
  const [attachmentIds, setAttachmentIds] = useState(() => pending?.attachmentIds ?? []);
  const startedHere = Boolean(pending); // este navegador iniciou o pagamento
  const paid = order?.paymentStatus === 'PAID';

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}/payment`);
      setOrder(data);
      setLoadError('');
    } catch (error) {
      if (error.response?.status === 404) setLoadError('Não encontrámos este pedido.');
    }
  }, [orderId]);

  // Pergunta ao servidor de 3 em 3 segundos até o pagamento cair.
  useEffect(() => {
    const startedAt = Date.now();
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > GIVE_UP_MS) {
        setTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      refresh();
    }, POLL_MS);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [refresh]);

  // Pagamento recebido: o carrinho já cumpriu a sua função.
  useEffect(() => {
    if (paid && startedHere) {
      clearCart();
      trackCatalogEvent('WHATSAPP_CLICK');
    }
  }, [paid]); // eslint-disable-line react-hooks/exhaustive-deps

  const whatsappUrl = paid ? createWhatsappUrl(createOrderMessage(order, { paid: true })) : '';
  const hasFiles = attachmentIds.length > 0;

  // Sem PDF para anexar, abrimos o WhatsApp automaticamente.
  useEffect(() => {
    if (!paid || hasFiles || !startedHere || sent) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => (value ?? REDIRECT_SECONDS + 1) - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paid, hasFiles, startedHere, sent, whatsappUrl]);

  // Quando a contagem termina, abre o WhatsApp.
  useEffect(() => {
    if (countdown === 0 && whatsappUrl) {
      clearPendingOrder();
      window.location.href = whatsappUrl;
    }
  }, [countdown, whatsappUrl]);

  async function finishCleanup() {
    await Promise.all(attachmentIds.map((id) => deleteCartAttachment(id).catch(() => {})));
    setAttachmentIds([]);
    setSent(true);
    clearPendingOrder();
  }

  async function sendOnWhatsapp() {
    setBusy(true);
    setCountdown(null);
    try {
      const files = (await Promise.all(attachmentIds.map((id) => getCartAttachment(id).catch(() => null)))).filter(Boolean);
      const message = createOrderMessage(order, { paid: true });
      if (files.length && navigator.share && navigator.canShare?.({ files })) {
        try {
          await navigator.share({ title: `Encomenda ${order.orderNumber} · BeeCraft`, text: `${message}\n\nPDF(s) da personalização anexado(s).`, files });
          await finishCleanup();
          setNotice('Pedido e PDF partilhados. Obrigado!');
          return;
        } catch (shareError) {
          if (shareError?.name === 'AbortError') return;
        }
      }
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      });
      if (files.length) setNotice('O PDF foi descarregado. Anexe-o na conversa do WhatsApp.');
      await finishCleanup();
      window.location.href = whatsappUrl;
    } finally {
      setBusy(false);
    }
  }

  async function retryPayment() {
    setBusy(true);
    setNotice('');
    try {
      const { data } = await api.post(`/orders/${orderId}/checkout`);
      window.location.assign(data.url);
    } catch (error) {
      setNotice(error.response?.data?.message ?? 'Não foi possível reabrir o pagamento. Tente novamente.');
      setBusy(false);
    }
  }

  return (
    <main className="container cart-page">
      <div className="breadcrumb"><Link to="/">Início</Link> / Pedido{order ? ` ${order.orderNumber}` : ''}</div>
      <div className="cart-empty-page order-status" aria-live="polite">
        {loadError ? (
          <>
            <h2>{loadError}</h2>
            <Link className="btn primary" to="/loja">Voltar à loja</Link>
          </>
        ) : !order ? (
          <p>A confirmar o seu pedido…</p>
        ) : paid ? (
          <>
            <h2>Pagamento recebido ✅</h2>
            <p>Obrigado! O pedido <b>{order.orderNumber}</b> ({money(order.total)}) está pago. Falta só enviar-nos os detalhes no WhatsApp.</p>
            {notice && <p className="checkout-notice" role="status">{notice}</p>}
            <button className="btn whatsapp-btn" type="button" onClick={sendOnWhatsapp} disabled={busy}>
              {hasFiles ? 'Enviar pedido e PDF no WhatsApp' : 'Abrir WhatsApp'}
            </button>
            {countdown > 0 ? <p className="order-status-hint">A abrir o WhatsApp em {countdown}…</p> : null}
          </>
        ) : order.paymentStatus === 'PENDING' ? (
          <>
            <h2>A aguardar o pagamento MB WAY</h2>
            <p>Abra a app <b>MB WAY</b> no telemóvel e aprove o pagamento de {money(order.total)}. Tem 4 minutos.</p>
            <p className="order-status-hint">Esta página atualiza sozinha e abre o WhatsApp assim que o pagamento for confirmado.</p>
            {timedOut && order.paymentStatus === 'PENDING' && <p className="form-error" role="alert">Ainda não recebemos a confirmação. Se já pagou, fale connosco no WhatsApp com o número {order.orderNumber}.</p>}
            {notice && <p className="form-error" role="alert">{notice}</p>}
            <button className="btn" type="button" onClick={retryPayment} disabled={busy}>Abrir página de pagamento</button>
          </>
        ) : (
          <>
            <h2>O pagamento não foi concluído</h2>
            <p>Não foi cobrado nada. Pode tentar novamente com o mesmo pedido.</p>
            {notice && <p className="form-error" role="alert">{notice}</p>}
            <button className="btn primary" type="button" onClick={retryPayment} disabled={busy}>Tentar pagar novamente</button>
          </>
        )}
      </div>
    </main>
  );
}
