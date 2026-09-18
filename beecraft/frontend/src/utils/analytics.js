const METRICS_URL = import.meta.env.VITE_MANAGEMENT_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8000/api' : '/adm-api');

function visitorId() {
  let id = localStorage.getItem('beecraft-visitor-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('beecraft-visitor-id', id);
  }
  return id;
}

export function trackCatalogEvent(eventType, productSlug = null, path = window.location.pathname) {
  fetch(`${METRICS_URL}/public/metrics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, visitor_id: visitorId(), product_slug: productSlug, path }),
    keepalive: true,
  }).catch(() => {});
}
