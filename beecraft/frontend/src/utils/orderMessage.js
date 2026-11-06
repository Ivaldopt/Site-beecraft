export const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

const DETAIL_LABELS = {
  orientation: 'Orientação',
  columns: 'Nº de colunas',
  startMonth: 'Início',
  appointmentHours: 'Horário',
  coverInstructions: 'Capa',
  elasticColor: 'Elástico',
  coilColor: 'Espiral',
};

/** Texto do WhatsApp. Com paid=true avisa que o pagamento por MB WAY já foi feito. */
export function createOrderMessage(order, { paid = false } = {}) {
  return [
    paid
      ? `Olá! Acabei de pagar por MB WAY o pedido ${order.orderNumber}:`
      : `Olá! Gostaria de confirmar o pedido ${order.orderNumber}:`,
    '',
    ...order.items.flatMap((item, index) => [
      `${index + 1}. ${item.productName}${item.variantName ? ` — ${item.variantName}` : ''}`,
      ...item.options.map((option) => `   • ${option.name}`),
      ...(item.customizationText ? [`   • Texto: ${item.customizationText}`] : []),
      ...(item.customizationTextColor ? [`   • Cor do texto: ${item.customizationTextColor}`] : []),
      ...Object.entries(item.customizationDetails ?? {})
        .filter(([, value]) => value)
        .map(([key, value]) => `   • ${DETAIL_LABELS[key] || key}: ${value}`),
      ...(item.customizationFileName ? [`   • Ficheiro a enviar: ${item.customizationFileName}`] : []),
      `   Quantidade: ${item.quantity} | Subtotal: ${money(item.total)}`,
      '',
    ]),
    paid ? `Total pago: ${money(order.total)}` : `Total validado: ${money(order.total)}`,
    '',
    paid
      ? 'Podem confirmar o prazo de produção e os dados para entrega?'
      : 'Podem confirmar o prazo de produção e os dados para entrega?',
  ].join('\n');
}

const PENDING_KEY = 'beecraft-pending-order';

/** Guarda o que é preciso para concluir no WhatsApp depois de pagar na Stripe. */
export function savePendingOrder(orderId, attachmentIds) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ orderId, attachmentIds }));
  } catch { /* o navegador pode bloquear o armazenamento */ }
}

export function readPendingOrder(orderId) {
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null');
    return stored?.orderId === orderId ? stored : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignorar */ }
}
