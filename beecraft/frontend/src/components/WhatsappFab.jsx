const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
import { trackCatalogEvent } from '../utils/analytics';

export function createWhatsappUrl(message) {
  const destination = WHATSAPP_NUMBER ? `/${WHATSAPP_NUMBER}` : '';
  return `https://wa.me${destination}?text=${encodeURIComponent(message)}`;
}

export default function WhatsappFab() {
  return (
    <a
      className="whatsapp-fab"
      href={createWhatsappUrl('Olá! Gostaria de saber mais sobre os produtos BeeCraft.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a BeeCraft pelo WhatsApp"
      onClick={() => trackCatalogEvent('WHATSAPP_CLICK')}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 3a12.7 12.7 0 0 0-11 19l-1.5 5.5 5.7-1.5A12.7 12.7 0 1 0 16 3Zm0 2.5a10.2 10.2 0 0 1 0 20.4 10 10 0 0 1-5.2-1.4l-.5-.3-3.3.9.9-3.2-.3-.5A10.2 10.2 0 0 1 16 5.5Zm-5.1 4.8c-.3 0-.7.1-.9.4-.3.3-1.1 1-1.1 2.6 0 1.5 1.1 3 1.3 3.2.2.2 2.2 3.4 5.4 4.7 2.7 1.1 3.2.9 3.8.8.6-.1 2-1 2.3-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5l-2.3-1.1c-.3-.1-.6-.2-.8.2l-1.1 1.4c-.2.3-.4.3-.8.1-1.8-.9-3-1.7-4.2-3.8-.3-.4.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.3c-.2-.4-.4-.4-.9-.4Z" />
      </svg>
    </a>
  );
}
