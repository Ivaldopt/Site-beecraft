import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { saveCartAttachment } from '../utils/cartAttachments';

const SPEC = { front: 50, cut: 60, cutRadius: 7, frontRadius: 5, bleed: 1 };
const MAX_MAGNETS = 240;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

function rounded(ctx, x, y, size, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
}

function rotatedSize(item) {
  return item.rotation % 2
    ? { width: item.image.height, height: item.image.width }
    : { width: item.image.width, height: item.image.height };
}

function drawCover(ctx, item, x, y, size) {
  const { image } = item;
  const rotated = rotatedSize(item);
  const scale = Math.max(size / rotated.width, size / rotated.height) * item.zoom;
  const overflowX = Math.max(0, rotated.width * scale - size);
  const overflowY = Math.max(0, rotated.height * scale - size);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.translate(x + size / 2 + item.x * overflowX / 2, y + size / 2 + item.y * overflowY / 2);
  ctx.rotate(item.rotation * Math.PI / 2);
  ctx.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
  ctx.restore();
}

function drawFit(ctx, item, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.filter = `blur(${Math.max(8, size * 0.035)}px)`;
  drawCover(ctx, { ...item, zoom: 1.15, x: 0, y: 0 }, x - size * 0.06, y - size * 0.06, size * 1.12);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(246, 240, 231, .12)';
  ctx.fillRect(x, y, size, size);
  ctx.restore();

  const { image } = item;
  const rotated = rotatedSize(item);
  const frontSize = SPEC.front * size / (SPEC.cut + SPEC.bleed * 2);
  const scale = Math.min(frontSize / rotated.width, frontSize / rotated.height) * item.zoom;
  const offsetX = item.x * Math.abs(frontSize - rotated.width * scale) / 2;
  const offsetY = item.y * Math.abs(frontSize - rotated.height * scale) / 2;
  const margin = (size - frontSize) / 2;

  ctx.save();
  rounded(ctx, x + margin, y + margin, frontSize, SPEC.frontRadius * size / (SPEC.cut + 2));
  ctx.clip();
  ctx.translate(x + size / 2 + offsetX, y + size / 2 + offsetY);
  ctx.rotate(item.rotation * Math.PI / 2);
  ctx.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
  ctx.restore();
}

function drawArtwork(ctx, item, x, y, size) {
  if (item.mode === 'fit') drawFit(ctx, item, x, y, size);
  else drawCover(ctx, item, x, y, size);
}

function drawCaption(ctx, item, x, y, size) {
  const caption = item.caption?.trim();
  if (!caption) return;
  const unit = size / (SPEC.cut + SPEC.bleed * 2);
  const frontSize = SPEC.front * unit;
  const margin = (size - frontSize) / 2;
  const inset = Math.max(4 * unit, SPEC.frontRadius * unit * .35);
  const width = frontSize - inset * 2;
  let fontSize = (item.textSize || 4) * unit;
  const font = item.font || 'Georgia';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const makeLines = () => {
    ctx.font = `700 ${fontSize}px "${font}", sans-serif`;
    const lines = [''];
    caption.replace(/\s+/g, ' ').split(' ').forEach((word) => {
      const index = lines.length - 1;
      const next = lines[index] ? `${lines[index]} ${word}` : word;
      if (ctx.measureText(next).width > width && lines[index]) lines.push(word);
      else lines[index] = next;
    });
    return lines;
  };
  let lines = makeLines();
  while (fontSize > 1.5 * unit && (lines.length > 3 || lines.some((line) => ctx.measureText(line).width > width))) {
    fontSize -= .2 * unit;
    lines = makeLines();
  }
  lines = lines.slice(0, 3);
  const lineHeight = fontSize * 1.2;
  const padding = fontSize * .55;
  const blockHeight = lines.length * lineHeight + padding * 2;
  const position = item.textPosition || 'bottom';
  let centerY = position === 'top' ? y + margin + inset + blockHeight / 2 : position === 'center' ? y + size / 2 : y + size - margin - inset - blockHeight / 2;
  centerY = Math.max(y + margin + inset + blockHeight / 2, Math.min(y + size - margin - inset - blockHeight / 2, centerY));
  const boxY = centerY - blockHeight / 2;
  ctx.fillStyle = item.textBackground === 'light' ? 'rgba(255,255,255,.84)' : item.textBackground === 'none' ? 'transparent' : 'rgba(0,0,0,.64)';
  if (item.textBackground !== 'none') {
    ctx.beginPath();
    ctx.roundRect(x + margin + inset - fontSize * .25, boxY, width + fontSize * .5, blockHeight, fontSize * .55);
    ctx.fill();
  }
  ctx.fillStyle = item.textColor || '#ffffff';
  ctx.shadowColor = item.textBackground === 'none' ? 'rgba(0,0,0,.9)' : 'transparent';
  ctx.shadowBlur = item.textBackground === 'none' ? fontSize * .3 : 0;
  lines.forEach((line, index) => ctx.fillText(line, x + size / 2, boxY + padding + lineHeight * (index + .5), width));
  ctx.restore();
}

function drawPreview(canvas, item) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const unit = size / (SPEC.cut + SPEC.bleed * 2);
  const frontMargin = (SPEC.cut + SPEC.bleed * 2 - SPEC.front) * unit / 2;
  ctx.clearRect(0, 0, size, size);
  drawArtwork(ctx, item, 0, 0, size);
  drawCaption(ctx, item, 0, 0, size);

  ctx.fillStyle = 'rgba(20, 20, 20, .34)';
  ctx.fillRect(0, 0, size, frontMargin);
  ctx.fillRect(0, size - frontMargin, size, frontMargin);
  ctx.fillRect(0, frontMargin, frontMargin, size - frontMargin * 2);
  ctx.fillRect(size - frontMargin, frontMargin, frontMargin, size - frontMargin * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#efc84e';
  rounded(ctx, SPEC.bleed * unit, SPEC.bleed * unit, SPEC.cut * unit, SPEC.cutRadius * unit);
  ctx.stroke();
  ctx.strokeStyle = '#54dda1';
  rounded(ctx, frontMargin, frontMargin, SPEC.front * unit, SPEC.frontRadius * unit);
  ctx.stroke();
}

function pdfFromJpegs(images) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;
  const put = (value) => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (id, body) => {
    offsets[id] = length;
    put(`${id} 0 obj\n${body}\nendobj\n`);
  };

  put('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(' ')}] >>`);
  images.forEach((image, index) => {
    const id = 3 + index * 3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.2756 841.8898] /Resources << /XObject << /Im ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`);
    const raw = Uint8Array.from(atob(image.split(',')[1]), (character) => character.charCodeAt(0));
    offsets[id + 1] = length;
    put(`${id + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width 2480 /Height 3508 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${raw.length} >>\nstream\n`);
    put(raw);
    put('\nendstream\nendobj\n');
    const content = 'q 595.2756 0 0 841.8898 0 0 cm /Im Do Q';
    object(id + 2, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  const xref = length;
  put(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => put(`${String(offset).padStart(10, '0')} 00000 n \n`));
  put(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

function safeFilename(value) {
  const clean = value.trim().normalize('NFC')
    .replace(/\p{Cc}/gu, '')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^[. -]+|[. -]+$/g, '')
    .slice(0, 70);
  return `BeeCraft-imas-${clean || 'personalizados'}.pdf`;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function MagnetCard({ item, onChange, onRemove }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => drawPreview(canvasRef.current, item), [item]);

  function startDrag(event) {
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x: item.x, y: item.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragRef.current) return;
    const nextX = Math.max(-1, Math.min(1, dragRef.current.x + (event.clientX - dragRef.current.clientX) / 120));
    const nextY = Math.max(-1, Math.min(1, dragRef.current.y + (event.clientY - dragRef.current.clientY) / 120));
    onChange({ x: nextX, y: nextY });
  }

  return <article className="magnet-builder-card">
    <canvas ref={canvasRef} width="520" height="520" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} aria-label={`Pré-visualização de ${item.name}`} />
    <div className="magnet-card-head"><strong title={item.name}>{item.name}</strong><button type="button" onClick={onRemove} aria-label={`Remover ${item.name}`}>Remover</button></div>
    <label>Enquadramento<select value={item.mode} onChange={(event) => onChange({ mode: event.target.value, zoom: 1, x: 0, y: 0 })}><option value="crop">Preencher toda a área</option><option value="fit">Foto completa + fundo desfocado</option></select></label>
    <label>Zoom <output>{Math.round(item.zoom * 100)}%</output><input type="range" min={item.mode === 'fit' ? .5 : 1} max="3" step=".01" value={item.zoom} onChange={(event) => onChange({ zoom: Number(event.target.value) })} /></label>
    <details className="magnet-text-settings" open={Boolean(item.caption)}>
      <summary>Adicionar texto ao íman <span>{item.caption ? 'Ativo' : 'Opcional'}</span></summary>
      <label>Mensagem<input type="text" maxLength="100" value={item.caption} onChange={(event) => onChange({ caption: event.target.value })} placeholder="Ex.: Nosso amor, 2026" /></label>
      <div className="magnet-text-grid">
        <label>Fonte<select value={item.font} onChange={(event) => onChange({ font: event.target.value })}><option value="Georgia">Elegante</option><option value="cursive">Romântica</option><option value="Trebuchet MS">Moderna</option><option value="Palatino Linotype">Clássica</option><option value="Verdana">Minimalista</option></select></label>
        <label>Posição<select value={item.textPosition} onChange={(event) => onChange({ textPosition: event.target.value })}><option value="bottom">Em baixo</option><option value="top">Em cima</option><option value="center">Centro</option></select></label>
        <label>Fundo<select value={item.textBackground} onChange={(event) => onChange({ textBackground: event.target.value })}><option value="dark">Faixa escura</option><option value="light">Faixa clara</option><option value="none">Sem faixa</option></select></label>
        <label>Cor<select value={item.textColor} onChange={(event) => onChange({ textColor: event.target.value })}><option value="#ffffff">Branco</option><option value="#222222">Preto</option><option value="#f5d875">Dourado</option></select></label>
      </div>
      <label>Tamanho da letra <output>{item.textSize} mm</output><input type="range" min="2" max="6" step=".25" value={item.textSize} onChange={(event) => onChange({ textSize: Number(event.target.value) })} /></label>
    </details>
    <div className="magnet-card-actions">
      <label>Quantidade<input type="number" min="1" max="120" value={item.quantity} onChange={(event) => onChange({ quantity: Math.max(1, Math.min(120, Number.parseInt(event.target.value, 10) || 1)) })} /></label>
      <button type="button" className="btn secondary btn-sm" onClick={() => onChange({ rotation: (item.rotation + 1) % 4, x: 0, y: 0 })}>Girar 90°</button>
    </div>
    <p className={Math.min(item.image.width, item.image.height) < 733 ? 'resolution-warning' : 'resolution-ok'}>{Math.min(item.image.width, item.image.height) < 733 ? 'Imagem pequena: confirme a nitidez antes de enviar.' : 'Resolução adequada para 50 mm.'}</p>
  </article>;
}

export default function MagnetBuilder() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [clientName, setClientName] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [outline, setOutline] = useState(false);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);
  const [latestFile, setLatestFile] = useState(null);
  const [product, setProduct] = useState(null);
  const inputRef = useRef(null);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const pages = Math.ceil(total / 12);

  useEffect(() => {
    api.get('/products/iman-button-personalizado')
      .then(({ data }) => setProduct(data))
      .catch(() => setStatus('O montador funciona, mas não foi possível carregar o preço do produto.'));
  }, []);

  async function addFiles(fileList) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    setStatus('A preparar as fotografias…');
    const next = [];
    let rejected = 0;
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_FILE_SIZE) { rejected += 1; continue; }
      try {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.src = url;
        await image.decode();
        URL.revokeObjectURL(url);
        next.push({ id: crypto.randomUUID(), image, name: file.name, mode: 'crop', zoom: 1, x: 0, y: 0, rotation: 0, quantity: 1, caption: '', font: 'Georgia', textPosition: 'bottom', textSize: 4, textBackground: 'dark', textColor: '#ffffff' });
      } catch { rejected += 1; }
    }
    setItems((current) => [...current, ...next]);
    setLatestFile(null);
    setStatus(rejected ? `${next.length} adicionada(s). ${rejected} ficheiro(s) foram ignorados; use JPG, PNG ou WebP até 50 MB.` : `${next.length} fotografia(s) adicionada(s). Ajuste o enquadramento antes de gerar o PDF.`);
  }

  function updateItem(id, changes) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
    setLatestFile(null);
  }

  async function createPdf({ calibration = false, downloadAfter = true } = {}) {
    if (!calibration && (!items.length || !total)) { setStatus('Adicione pelo menos uma fotografia.'); return null; }
    if (total > MAX_MAGNETS) { setStatus(`O limite é ${MAX_MAGNETS} ímanes por PDF. Reduza as quantidades.`); return null; }
    setWorking(true);
    setStatus('A preparar o PDF em alta qualidade…');
    try {
      const list = calibration ? [null] : items.flatMap((item) => Array(item.quantity).fill(item));
      const pageImages = [];
      for (let start = 0; start < list.length; start += 12) {
        const canvas = document.createElement('canvas');
        canvas.width = 2480;
        canvas.height = 3508;
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / 210;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < Math.min(12, list.length - start); index += 1) {
          const x = 5 + (index % 3) * 68 + (68 - SPEC.cut) / 2;
          const y = 12 + Math.floor(index / 3) * 68 + (68 - SPEC.cut) / 2;
          if (!calibration) {
            const item = list[start + index];
            const drawX = (x - SPEC.bleed) * scale;
            const drawY = (y - SPEC.bleed) * scale;
            const drawSize = (SPEC.cut + SPEC.bleed * 2) * scale;
            drawArtwork(ctx, item, drawX, drawY, drawSize);
            drawCaption(ctx, item, drawX, drawY, drawSize);
          }
          if (calibration || outline) {
            ctx.lineWidth = .15 * scale;
            ctx.strokeStyle = '#555';
            rounded(ctx, x * scale, y * scale, SPEC.cut * scale, SPEC.cutRadius * scale);
            ctx.stroke();
          }
        }
        if (calibration) {
          ctx.fillStyle = '#222';
          ctx.font = `${4 * scale}px sans-serif`;
          ctx.fillText('BeeCraft · calibração 50 / 60 mm', 20 * scale, 300 * scale);
          ctx.font = `${3 * scale}px sans-serif`;
          ctx.fillText('Imprimir em A4 a 100%, sem ajustar à página. Medir antes de produzir.', 20 * scale, 308 * scale);
        }
        pageImages.push(canvas.toDataURL('image/jpeg', .97));
        setStatus(`A preparar folha ${pageImages.length} de ${Math.max(1, Math.ceil(list.length / 12))}…`);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      const name = calibration ? 'BeeCraft-calibracao-A4.pdf' : safeFilename(orderReference || clientName);
      const file = new File([pdfFromJpegs(pageImages)], name, { type: 'application/pdf' });
      if (!calibration) setLatestFile(file);
      if (downloadAfter) download(file);
      setStatus(calibration ? 'PDF de calibração descarregado.' : 'PDF pronto. Guarde-o e envie-o à BeeCraft para confirmarmos a produção.');
      return file;
    } catch {
      setStatus('Não foi possível gerar o PDF. Tente menos fotografias de cada vez.');
      return null;
    } finally { setWorking(false); }
  }

  async function sharePdf() {
    const file = latestFile ?? await createPdf({ downloadAfter: false });
    if (!file) return;
    const message = `Olá BeeCraft! Segue o PDF dos meus ${total} ímanes${orderReference ? `, referência ${orderReference}` : ''}${clientName ? `, cliente ${clientName}` : ''}.`;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'Ímanes personalizados BeeCraft', text: message, files: [file] });
        setStatus('PDF partilhado. A BeeCraft confirmará o ficheiro antes de produzir.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    download(file);
    if (WHATSAPP_NUMBER) window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${message}\n\nO PDF foi descarregado. Vou anexá-lo nesta conversa.`)}`, '_blank', 'noopener,noreferrer');
    setStatus('O PDF foi descarregado. Anexe-o manualmente na conversa do WhatsApp que abrimos.');
  }

  async function addPdfToCart() {
    if (!product) {
      setStatus('Ainda estamos a carregar os dados do produto. Tente novamente dentro de instantes.');
      return;
    }
    const file = latestFile ?? await createPdf({ downloadAfter: false });
    if (!file) return;
    setWorking(true);
    setStatus('A guardar o PDF no carrinho…');
    try {
      const attachmentId = await saveCartAttachment(file);
      const variant = product.variants?.find((entry) => entry.name.includes('55')) ?? product.variants?.[0];
      const photoOption = product.options?.find((entry) => entry.slug === 'personalizacao')?.values?.find((entry) => entry.value === 'foto');
      const squareOption = product.options?.find((entry) => entry.slug === 'formato-iman')?.values?.find((entry) => entry.value === 'quadrado');
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        image: product.images?.[0]?.url ?? '',
        variantId: variant?.id ?? null,
        variantName: `${variant?.name ?? '50 mm'} · PDF com ${total} ímanes`,
        optionValueIds: [photoOption?.id, squareOption?.id].filter(Boolean),
        optionsSummary: [`PDF pronto: ${file.name}`, `${items.length} fotografia(s) · ${pages} folha(s) A4`, `${items.filter((item) => item.caption.trim()).length} design(s) com texto`],
        customizationFileName: file.name,
        attachmentId,
        attachmentType: file.type,
        quantity: total,
        unitPrice: Number(variant?.price ?? product.basePrice),
      });
      setStatus('PDF adicionado ao carrinho.');
      navigate('/carrinho');
    } catch {
      setStatus('Não foi possível guardar o PDF no carrinho. Descarregue-o e tente novamente.');
    } finally {
      setWorking(false);
    }
  }

  return <main className="magnet-builder-page">
    <section className="magnet-builder-hero"><div className="container"><div className="eyebrow">Montador de ímanes BeeCraft</div><h1>As suas fotos, prontas para produzir.</h1><p>Adicione, enquadre e envie o PDF final. Tudo é processado no seu dispositivo.</p><div className="magnet-builder-steps" aria-label="Etapas"><span className={items.length ? 'done' : 'active'}><b>1</b>Adicionar</span><span className={items.length ? 'active' : ''}><b>2</b>Ajustar</span><span className={latestFile ? 'done' : ''}><b>3</b>Enviar PDF</span></div></div></section>
    <div className="container magnet-builder-layout">
      <section className="magnet-builder-main">
        <div className="builder-toolbar">
          <div><h2>1. Adicione as fotografias</h2><p>JPG, PNG ou WebP, até 50 MB por imagem.</p></div>
          <button type="button" className="btn honeyed" onClick={() => inputRef.current?.click()}>+ Escolher fotografias</button>
          <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        </div>
        {!items.length ? <button type="button" className="magnet-dropzone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><strong>Arraste as fotografias para aqui</strong><span>ou toque para escolher no seu dispositivo</span><small>As imagens não são enviadas para nenhum servidor.</small></button> : <><div className="builder-section-heading"><div><h2>2. Ajuste cada íman</h2><p>Arraste a imagem, escolha o enquadramento e indique a quantidade.</p></div><button type="button" onClick={() => setItems((current) => current.map((item) => ({ ...item, mode: 'fit', zoom: 1, x: 0, y: 0 })))}>Ver fotos completas</button></div><div className="magnet-builder-grid">{items.map((item) => <MagnetCard key={item.id} item={item} onChange={(changes) => updateItem(item.id, changes)} onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} />)}</div></>}
      </section>
      <aside className="magnet-builder-summary">
        <div className="summary-sticky"><span className="summary-label">Resumo do ficheiro</span><h2>{total || 0} ímanes</h2><dl><div><dt>Fotografias</dt><dd>{items.length}</dd></div><div><dt>Folhas A4</dt><dd>{pages || 0}</dd></div><div><dt>Por folha</dt><dd>12</dd></div><div><dt>Tamanho visível</dt><dd>50 × 50 mm</dd></div></dl>
          <label>Nome do cliente<input value={clientName} maxLength="100" onChange={(event) => setClientName(event.target.value)} placeholder="Ex.: Maria Silva" /></label>
          <label>Referência da encomenda <span>(opcional)</span><input value={orderReference} maxLength="50" onChange={(event) => setOrderReference(event.target.value)} placeholder="Ex.: BC-1024" /></label>
          <label className="builder-check"><input type="checkbox" checked={outline} onChange={(event) => setOutline(event.target.checked)} /> Incluir contorno de corte no PDF</label>
          <button type="button" className="btn primary btn-block" disabled={!total || working || total > MAX_MAGNETS} onClick={addPdfToCart}>{working ? 'A preparar…' : 'Adicionar PDF ao carrinho'}</button>
          <button type="button" className="btn secondary btn-block" disabled={!total || working || total > MAX_MAGNETS} onClick={() => createPdf()}>Descarregar uma cópia</button>
          <button type="button" className="btn honeyed btn-block" disabled={!total || working || total > MAX_MAGNETS} onClick={sharePdf}>Enviar PDF sem comprar</button>
          <button type="button" className="builder-link" disabled={working} onClick={() => createPdf({ calibration: true })}>Descarregar folha de calibração</button>
          {items.length > 0 && <button type="button" className="builder-link danger" onClick={() => { if (window.confirm('Remover todas as fotografias deste projeto?')) { setItems([]); setLatestFile(null); setStatus('Projeto limpo.'); } }}>Limpar projeto</button>}
          <p className="builder-status" role="status" aria-live="polite">{status}</p>
          <div className="builder-privacy"><b>Privacidade</b><p>As fotografias ficam apenas neste navegador. O PDF só é partilhado quando escolher enviá-lo.</p></div>
        </div>
      </aside>
    </div>
    <section className="builder-help"><div className="container"><h2>Antes de enviar</h2><div><article><b>Verde</b><p>Área visível do íman. Mantenha rostos e texto dentro dela.</p></article><article><b>Amarelo</b><p>Linha de corte. A margem exterior garante a sangria necessária.</p></article><article><b>PDF A4</b><p>Imprima sempre a 100%, sem “ajustar à página”.</p></article></div><Link className="btn secondary" to="/imanes-acessorios">Voltar aos ímanes</Link></div></section>
  </main>;
}
