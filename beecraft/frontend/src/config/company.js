const clean = (value) => (value ?? '').trim();
const phoneDigits = clean(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '');

// Estes dados aparecem no rodapé e nas páginas legais. Defina-os na Vercel
// (VITE_COMPANY_*); o que estiver vazio simplesmente não é mostrado.
export const company = {
  name: clean(import.meta.env.VITE_COMPANY_NAME) || 'BeeCraft Papelaria',
  legalName: clean(import.meta.env.VITE_COMPANY_LEGAL_NAME),
  nif: clean(import.meta.env.VITE_COMPANY_NIF),
  address: clean(import.meta.env.VITE_COMPANY_ADDRESS) || 'Loulé, Algarve, Portugal',
  email: clean(import.meta.env.VITE_COMPANY_EMAIL),
  phone: phoneDigits
    ? `+${phoneDigits}`.replace(/^(\+351)(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4')
    : '',
  phoneHref: phoneDigits ? `tel:+${phoneDigits}` : '',
};
