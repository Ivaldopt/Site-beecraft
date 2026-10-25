import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { trackCatalogEvent } from '../utils/analytics';
import { saveCartAttachment } from '../utils/cartAttachments';

const money = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
const PRODUCTION_ESTIMATE = import.meta.env.VITE_PRODUCTION_ESTIMATE ?? '5 a 7 dias úteis';

function normalized(value = '') {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function selectOptionValue(option, configuration) {
  const values = option.values ?? [];
  const slug = normalized(option.slug);
  let search = '';
  if (slug.includes('personalizacao')) search = configuration.imagens_frente ? 'foto' : 'nome';
  if (slug.includes('encadernacao')) search = normalized(configuration.encadernacao).includes('wire') ? 'wire' : normalized(configuration.encadernacao).includes('espiral') ? 'espiral' : '';
  if (slug.includes('miolo') || slug.includes('interior')) search = normalized(configuration.miolo).includes('paut') ? 'paut' : normalized(configuration.miolo).includes('quad') ? 'quad' : normalized(configuration.miolo).includes('pont') ? 'pont' : 'branco';
  if (slug.includes('extras') && normalized(configuration.encadernacao).includes('elastico')) search = 'elastico';
  if (search) return values.find((value) => normalized(`${value.value} ${value.name}`).includes(search)) ?? (option.required ? values[0] : null);
  return option.required ? values[0] : null;
}

function previewPdf(images, imageWidth, imageHeight) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;
  const put = (value) => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; parts.push(bytes); length += bytes.length; };
  const object = (id, body) => { offsets[id] = length; put(`${id} 0 obj\n${body}\nendobj\n`); };
  put('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(' ')}] >>`);
  images.forEach((image, index) => {
    const id = 3 + index * 3;
    const raw = Uint8Array.from(atob(image.split(',')[1]), (character) => character.charCodeAt(0));
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.2756 841.8898] /Resources << /XObject << /Im ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`);
    offsets[id + 1] = length;
    put(`${id + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${raw.length} >>\nstream\n`);
    put(raw); put('\nendstream\nendobj\n');
    const ratio = Math.min(555.2756 / imageWidth, 801.8898 / imageHeight);
    const drawWidth = imageWidth * ratio;
    const drawHeight = imageHeight * ratio;
    const content = `q ${drawWidth} 0 0 ${drawHeight} ${(595.2756 - drawWidth) / 2} ${(841.8898 - drawHeight) / 2} cm /Im Do Q`;
    object(id + 2, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  const xref = length;
  put(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => put(`${String(offset).padStart(10, '0')} 00000 n \n`));
  put(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

export default function AgendaStudio({ productOverride = null }) {
  const { slug = 'agenda-a5-personalizada' } = useParams();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const frameRef = useRef(null);
  const [product, setProduct] = useState(productOverride);
  const [status, setStatus] = useState(productOverride ? 'Personalize a agenda no atelier 3D.' : 'A carregar os dados da agenda…');
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productOverride) { setProduct(productOverride); return; }
    api.get(`/products/${slug}`)
      .then(({ data }) => { setProduct(data); setStatus('Personalize a agenda no atelier 3D.'); })
      .catch(() => setStatus('Não foi possível carregar este produto. Volte à página da agenda e tente novamente.'));
  }, [slug, productOverride]);

  useEffect(() => {
    async function receiveConfiguration(event) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow || event.data?.type !== 'BEECRAFT_AGENDA_ADD') return;
      if (!product || adding) return;
      setAdding(true);
      setStatus('A validar preço e configuração…');
      try {
        const configuration = event.data.configuration;
        const variant = product.variants?.find((entry) => normalized(entry.name).includes(normalized(configuration.formato))) ?? product.variants?.[0];
        const selectedValues = product.options.flatMap((option) => {
          if (normalized(option.slug).includes('extras')) {
            const wanted = [
              configuration.cor_elastico && 'elastico',
              configuration.cantoneiras && 'cantoneira',
              configuration.marcador && 'marcador',
            ].filter(Boolean);
            return option.values.filter((value) => wanted.some((key) => normalized(`${value.value} ${value.name}`).includes(key)));
          }
          if (!option.required && !['personalizacao', 'encadernacao', 'miolo', 'interior'].some((key) => normalized(option.slug).includes(key))) return [];
          return [selectOptionValue(option, configuration)].filter(Boolean);
        });
        const optionValueIds = selectedValues.map((value) => value.id);
        const { data: price } = await api.post('/pricing/calculate', {
          productId: product.id,
          variantId: variant?.id || undefined,
          optionValueIds,
          quantity,
        });
        const details = [
          `Formato ${configuration.formato} (${configuration.dimensoes_mm.join(' × ')} mm)`,
          configuration.encadernacao,
          configuration.acabamento,
          configuration.cor_elastico ? `Elástico ${configuration.cor_elastico}` : 'Sem elástico',
          configuration.cantoneiras ? 'Cantoneiras metálicas' : null,
          configuration.marcador ? `Marcador de página${configuration.cor_marcador ? ` ${configuration.cor_marcador}` : ''}` : null,
          `${configuration.folhas} folhas`,
          `Miolo ${configuration.miolo}`,
          configuration.agenda_com_datas ? `${configuration.organizacao}, ${configuration.ano}` : 'Sem datas',
        ].filter(Boolean);
        const previewFile = new File(
          [previewPdf([event.data.frontPreview, event.data.backPreview].filter(Boolean), event.data.previewWidth, event.data.previewHeight)],
          `BeeCraft-agenda-${configuration.formato}-capa-e-verso.pdf`,
          { type: 'application/pdf' },
        );
        const attachmentId = await saveCartAttachment(previewFile);
        addItem({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          image: product.images?.[0]?.url ?? null,
          variantId: price.variantId,
          variantName: `${configuration.formato} · ${configuration.encadernacao}`,
          optionValueIds,
          optionsSummary: details,
          customizationFileName: previewFile.name,
          attachmentId,
          attachmentType: previewFile.type,
          customizationText: `${configuration.titulo}${configuration.nome ? ` · ${configuration.nome}` : ''}`.slice(0, 100),
          customizationDetails: { coverInstructions: details.join(' · ').slice(0, 500) },
          agendaStudioConfiguration: configuration,
          quantity,
          unitPrice: price.unitPrice,
        });
        trackCatalogEvent('ADD_TO_CART', product.slug);
        navigate('/carrinho');
      } catch (error) {
        const message = error.response?.data?.message;
        setStatus(Array.isArray(message) ? message.join(' ') : message ?? 'Não foi possível adicionar esta configuração. Reveja as opções e tente novamente.');
      } finally {
        setAdding(false);
      }
    }
    window.addEventListener('message', receiveConfiguration);
    return () => window.removeEventListener('message', receiveConfiguration);
  }, [product, adding, addItem, navigate, quantity]);

  function requestAddToCart() {
    if (!product || adding) return;
    setStatus('A recolher a configuração do atelier 3D…');
    frameRef.current?.contentWindow?.postMessage({ type: 'BEECRAFT_AGENDA_REQUEST_ADD' }, window.location.origin);
  }

  return <main className="agenda-studio-page">
    <section className="container agenda-studio-shell">
      <div className="breadcrumb"><Link to="/">Início</Link> / <Link to="/agendas-planners">Agendas e planners</Link> / {product?.name ?? 'Agenda personalizada'}</div>
      <div className="agenda-unified-head">
        <div><div className="eyebrow">Personalização 3D BeeCraft</div><h1>{product?.name ?? 'Agenda personalizada'}</h1><p>{product?.shortDesc ?? 'Crie a capa, o verso e o interior da sua agenda e veja o resultado em tempo real.'}</p></div>
        <div className="agenda-unified-order"><span>Desde</span><strong>{money(Number(product?.basePrice ?? 0) * quantity)}</strong><small>IVA incluído · preço final validado ao adicionar</small><div className="production-banner"><strong>Produção por encomenda</strong><span>Estimativa: {PRODUCTION_ESTIMATE}, antes do envio</span></div></div>
      </div>
      <div className="pdp-benefits agenda-unified-benefits"><div><b>01</b><span><strong>Feito em Loulé</strong>Produção artesanal</span></div><div><b>02</b><span><strong>Prévia 3D completa</strong>Capa, verso e interior</span></div><div><b>03</b><span><strong>Revisão antes de produzir</strong>Confirmamos todos os detalhes</span></div></div>
      <div className="agenda-studio-status" role="status"><span className={adding ? 'loading' : ''} />{status}</div>
      <iframe ref={frameRef} className="agenda-studio-frame" src="/agenda-3d/index.html" title="Atelier 3D para personalizar agenda BeeCraft" allow="webgl" />
      <div className="agenda-checkout-bar">
        <div><strong>A sua agenda está pronta?</strong><span>Revise a capa, o verso, o miolo e os acabamentos antes de continuar.</span></div>
        <div className="qty-stepper"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(100, value + 1))} aria-label="Aumentar quantidade">+</button></div>
        <button type="button" className="btn primary" onClick={requestAddToCart} disabled={!product || adding}>{adding ? 'A validar…' : 'Adicionar personalizado ao carrinho'}</button>
      </div>
      <div className="agenda-studio-specs">
        <article><b>Personalização completa</b><p>Frente, verso, textos, fotografias, cores e elementos decorativos.</p></article>
        <article><b>Interior à sua medida</b><p>Pautado, branco, pontilhado ou quadriculado, com páginas adicionais e opção com datas.</p></article>
        <article><b>Formatos e acabamento</b><p>A6, A5, B5, A4 ou quadrada; Wire-O, espiral, capa dura e opção de elástico com escolha de cor.</p></article>
        <article><b>Produção artesanal</b><p>Prazo estimado de {PRODUCTION_ESTIMATE}. A arte final é revista antes da produção.</p></article>
      </div>
      <div className="agenda-studio-note"><strong>Importante</strong><p>A prévia 3D é ilustrativa. Medidas, cores e espessuras podem variar ligeiramente conforme ecrã, material e acabamento. Confirmamos consigo qualquer ajuste antes de produzir.</p><Link className="btn secondary" to="/agendas-planners">Ver outras agendas</Link></div>
      <div className="pdp-content-accordions agenda-unified-details">
        <details open><summary>Descrição</summary><p>{product?.description || product?.shortDesc}</p></details>
        <details><summary>O que está incluído</summary><p>Personalização da capa e contracapa, configuração do interior, montagem artesanal e revisão da arte antes da produção.</p></details>
        <details><summary>Ficheiros e cores</summary><p>Utilize fotografias nítidas. As cores vistas no ecrã são aproximadas e podem variar ligeiramente na impressão. O PDF da capa e do verso acompanha automaticamente o pedido.</p></details>
        <details><summary>Produção e entrega</summary><p>A produção demora aproximadamente {PRODUCTION_ESTIMATE}. O envio é confirmado separadamente antes do pagamento.</p></details>
      </div>
    </section>
  </main>;
}
