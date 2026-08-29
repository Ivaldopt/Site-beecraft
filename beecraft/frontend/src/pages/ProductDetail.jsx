import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import AgendaPreviewCanvas from '../components/AgendaPreviewCanvas';

const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [customizationFile, setCustomizationFile] = useState(null);
  const [customizationPreview, setCustomizationPreview] = useState('');
  const [customizationText, setCustomizationText] = useState('');

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        setVariantId(data.variants?.[0]?.id ?? '');
        setSelected(Object.fromEntries(
          data.options
            .filter((option) => option.required && option.values.length === 1)
            .map((option) => [option.id, [option.values[0].id]]),
        ));
      })
      .catch(() => setError('Não foi possível carregar este produto.'));
  }, [slug]);

  const optionValueIds = useMemo(() => Object.values(selected).flat(), [selected]);
  const selectedCustomization = product?.options
    .find((option) => option.slug === 'personalizacao')
    ?.values.find((value) => optionValueIds.includes(value.id));
  const needsFile = ['foto', 'logo', 'logotipo'].includes(
    selectedCustomization?.value?.toLowerCase(),
  );
  const needsText = selectedCustomization?.value?.toLowerCase() === 'nome';
  const previewSelections = useMemo(() => product?.options.flatMap((option) =>
    option.values
      .filter((value) => optionValueIds.includes(value.id))
      .map((value) => ({ optionSlug: option.slug, value: value.name })),
  ) ?? [], [product, optionValueIds]);

  useEffect(() => {
    if (!product) return;
    api.post('/pricing/calculate', {
      productId: product.id,
      variantId: variantId || undefined,
      optionValueIds,
      quantity,
    }).then(({ data }) => {
      setPrice(data);
      setError('');
    }).catch((requestError) => {
      setPrice(null);
      setError(requestError.response?.data?.message ?? 'Selecione as opções obrigatórias.');
    });
  }, [product, variantId, optionValueIds, quantity]);

  function choose(option, valueId) {
    if (option.slug === 'personalizacao') {
      setCustomizationFile(null);
      setCustomizationPreview('');
      setCustomizationText('');
    }
    setSelected((current) => {
      const values = current[option.id] ?? [];
      const isMultiple = option.slug === 'extras';
      return {
        ...current,
        [option.id]: isMultiple
          ? values.includes(valueId) ? values.filter((id) => id !== valueId) : [...values, valueId]
          : [valueId],
      };
    });
  }

  function chooseCustomizationFile(file) {
    setCustomizationFile(file ?? null);
    setCustomizationPreview('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomizationPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    if (!price || (needsFile && !customizationFile) || (needsText && !customizationText.trim())) return;
    setAdding(true);
    const optionNames = product.options.flatMap((option) =>
      option.values
        .filter((value) => optionValueIds.includes(value.id))
        .map((value) => `${option.name}: ${value.name}`),
    );
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: product.images?.[0]?.url ?? null,
      variantId: price.variantId,
      variantName: price.variantName,
      optionValueIds,
      optionsSummary: optionNames,
      customizationFileName: customizationFile?.name ?? null,
      customizationText: customizationText.trim() || null,
      quantity,
      unitPrice: price.unitPrice,
    });
    navigate('/carrinho');
  }

  if (error && !product) return <main className="container page-state">{error}</main>;
  if (!product) return <main className="container page-state">A carregar produto...</main>;

  return (
    <main className="container">
      <div className="breadcrumb"><Link to="/">Início</Link> / {product.category.name} / {product.name}</div>
      <section className="pdp">
        <div className="pdp-grid">
          <div className="pdp-gallery">
            <AgendaPreviewCanvas
              productName={product.name}
              customization={selectedCustomization?.value?.toLowerCase() ?? ''}
              text={customizationText}
              image={customizationPreview}
              selections={previewSelections}
            />
          </div>
          <div className="pdp-info">
            <div className="eyebrow">{product.category.name}</div>
            <h1>{product.name}</h1>
            <p>{product.shortDesc}</p>

            {product.variants.length > 1 && <>
              <div className="pdp-section-title">Modelo</div>
              <select className="pdp-select" value={variantId} onChange={(event) => setVariantId(event.target.value)}>
                {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
              </select>
            </>}

            {product.options.map((option) => (
              <div key={option.id}>
                <div className="pdp-section-title">{option.name}{option.required ? ' *' : ''}</div>
                <div className={option.slug === 'extras' ? 'extras-list' : 'radio-list'}>
                  {option.values.map((value) => {
                    const checked = (selected[option.id] ?? []).includes(value.id);
                    return <label key={value.id} className={`${option.slug === 'extras' ? 'extra-item' : 'radio-item'} ${checked ? 'checked' : ''}`}>
                      <span className="left">
                        <input type={option.slug === 'extras' ? 'checkbox' : 'radio'} name={option.id} checked={checked} onChange={() => choose(option, value.id)} />
                        {value.name}
                      </span>
                      {Number(value.priceDelta) > 0 && <span className="add-price">+ {money(value.priceDelta)}</span>}
                    </label>;
                  })}
                </div>
              </div>
            ))}

            {needsFile && (
              <div>
                <div className="pdp-section-title">
                  Enviar {selectedCustomization?.name} *
                </div>
                <label className="upload-box">
                  <strong>
                    {customizationFile ? 'Trocar ficheiro' : 'Escolher imagem'}
                  </strong>
                  <span>JPG, PNG ou WEBP</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      chooseCustomizationFile(event.target.files?.[0])
                    }
                  />
                  {customizationPreview && (
                    <img src={customizationPreview} alt="Pré-visualização da personalização" />
                  )}
                </label>
                <p className="hint">
                  Ao finalizar, envie também este ficheiro na conversa do WhatsApp.
                </p>
              </div>
            )}

            {needsText && (
              <div className="field personalization-name-field">
                <label htmlFor="personalization-name">Nome na capa *</label>
                <input
                  id="personalization-name"
                  type="text"
                  maxLength="32"
                  value={customizationText}
                  onChange={(event) => setCustomizationText(event.target.value)}
                  placeholder="Ex.: Maria Silva"
                />
                <span className="hint">{customizationText.length}/32 caracteres</span>
              </div>
            )}

            <div className="qty-row">
              <span>Quantidade</span>
              <div className="qty-stepper">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir">&minus;</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((value) => value + 1)} aria-label="Aumentar">+</button>
              </div>
            </div>
            <div className="pdp-price-row"><span className="amt">{money(price?.total ?? product.basePrice * quantity)}</span><span className="vat">IVA incluído</span></div>
            {error && <p className="form-error">{error}</p>}
            <button className="btn primary btn-block" disabled={!price || adding || (needsFile && !customizationFile) || (needsText && !customizationText.trim())} onClick={handleAdd}>
              {adding ? 'A adicionar...' : 'Adicionar ao carrinho'}
            </button>
            <p className="pdp-shipping-note">O preço é validado pelo servidor antes de o artigo ser adicionado. Finalize o pedido diretamente pelo WhatsApp.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
