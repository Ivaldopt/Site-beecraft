import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import AgendaPreviewCanvas from '../components/AgendaPreviewCanvas';

const money = (value) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
const PRODUCTION_ESTIMATE = import.meta.env.VITE_PRODUCTION_ESTIMATE ?? '5 a 7 dias úteis';
const COVER_COLORS = {
  branca: '#f4f1eb', preta: '#252525', rosa: '#dca2ad', azul: '#7aa3bd',
  verde: '#7f9b7b', lilas: '#a996bd', bege: '#d8c3a5', vermelha: '#a84b47',
};

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
  const [textColor, setTextColor] = useState('#25211e');
  const [galleryMode, setGalleryMode] = useState('preview');
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [customDetails, setCustomDetails] = useState({ orientation: 'Vertical', columns: '', startMonth: '', appointmentHours: '', coverInstructions: '', elasticColor: '', coilColor: '' });

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
        api.get('/products', { params: { category: data.category.slug } })
          .then((response) => setRelatedProducts(response.data.filter((item) => item.id !== data.id).slice(0, 4)))
          .catch(() => setRelatedProducts([]));
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
  const customizable = product?.saleType !== 'READY_MADE';
  const extrasOption = product?.options.find((option) => option.slug === 'extras');
  const bindingOption = product?.options.find((option) => option.slug === 'encadernacao');
  const coverColorOption = product?.options.find((option) => option.slug === 'cor-da-capa');
  const startMonths = useMemo(() => Array.from({ length: 13 }, (_, offset) => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1);
    const end = new Date(start.getFullYear() + 1, start.getMonth(), 0);
    return { value: start.toISOString().slice(0, 7), label: `${start.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })} — ${end.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}` };
  }), []);

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

  function chooseCoverMode(valueName) {
    const option = product.options.find((item) => item.slug === 'personalizacao');
    const value = option?.values.find((item) => item.value?.toLowerCase() === valueName);
    if (option && value) choose(option, value.id);
  }

  function chooseElasticColor(color) {
    setCustomDetails((current) => ({ ...current, elasticColor: color }));
    const elastic = extrasOption?.values.find((value) => value.value === 'elastico');
    if (color && elastic && !(selected[extrasOption.id] ?? []).includes(elastic.id)) {
      choose(extrasOption, elastic.id);
    }
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
      customizationTextColor: needsText ? textColor : null,
      customizationDetails: customizable ? customDetails : null,
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
            <div className="pdp-view-switch" role="tablist" aria-label="Visualização do produto">
              <button type="button" className={galleryMode === 'preview' ? 'active' : ''} onClick={() => setGalleryMode('preview')}>Preview ao vivo</button>
              {product.images?.length > 0 && <button type="button" className={galleryMode === 'photos' ? 'active' : ''} onClick={() => setGalleryMode('photos')}>Fotografias</button>}
            </div>
            {galleryMode === 'photos' && product.images?.length ? (
              <div className="pdp-photo-gallery">
                <div className="pdp-main-img"><img src={product.images[activeImage].url} alt={product.images[activeImage].alt || product.name} /></div>
                <div className="pdp-thumbs">{product.images.map((image, index) => <button type="button" key={image.id || image.url} className={`pdp-thumb ${activeImage === index ? 'active' : ''}`} onClick={() => setActiveImage(index)}><img src={image.url} alt={image.alt || `${product.name} ${index + 1}`} loading="lazy" /></button>)}</div>
              </div>
            ) : customizable ? (
              <AgendaPreviewCanvas productName={product.name} customization={selectedCustomization?.value?.toLowerCase() ?? ''} text={customizationText} textColor={textColor} image={customizationPreview} selections={previewSelections} details={customDetails} />
            ) : (
              <div className="ready-product-visual"><div className="ready-cover"><span>BeeCraft</span><strong>Mediterrânea</strong><small>AGENDA A5 · SEMANAL</small></div><p>Design pronto a comprar</p></div>
            )}
          </div>
          <div className="pdp-info">
            <div className="pdp-kicker"><span>{product.category.name}</span><b>{customizable ? 'Disponível por encomenda' : 'Pronto a comprar'}</b></div>
            <h1>{product.name}</h1>
            <div className="pdp-reference">REF. {product.variants?.[0]?.sku || product.slug.toUpperCase()}</div>
            <p>{product.shortDesc}</p>
            <div className="production-banner"><strong>{customizable ? 'Produção por encomenda' : 'Design pronto'}</strong><span>{customizable ? `Estimativa: ${PRODUCTION_ESTIMATE}, antes do envio` : 'Sem criação de capa: confirme apenas a quantidade e o pedido'}</span></div>

            <div className="pdp-benefits">
              <div><b>01</b><span><strong>Feito em Loulé</strong>Produção artesanal</span></div>
              <div><b>02</b><span><strong>{customizable ? 'Personalização total' : 'Design exclusivo'}</strong>{customizable ? 'Veja antes de pedir' : 'Pronto sem configurar'}</span></div>
              <div><b>03</b><span><strong>Acabamento cuidado</strong>Preparado para durar</span></div>
            </div>

            {customizable && <section className="cover-configurator" aria-labelledby="cover-configurator-title">
              <div className="configurator-heading"><span>Personalize</span><h2 id="cover-configurator-title">A capa e o interior</h2><p>Escolha as opções para adaptar a agenda ao seu dia a dia.</p></div>
              <fieldset className="compact-choice"><legend>Orientação</legend>{['Horizontal', 'Vertical'].map((value) => <label key={value}><input type="radio" name="orientation" checked={customDetails.orientation === value} onChange={() => setCustomDetails({ ...customDetails, orientation: value })} /> {value}</label>)}</fieldset>
              <fieldset className="cover-mode-choice"><legend>Design da capa</legend>
                <button type="button" className={selectedCustomization?.value === 'nome' ? 'selected' : ''} onClick={() => chooseCoverMode('nome')}><b>Aa</b><span>Nome ou frase</span></button>
                <button type="button" className={selectedCustomization?.value === 'foto' ? 'selected' : ''} onClick={() => chooseCoverMode('foto')}><b>▣</b><span>Foto na capa inteira</span></button>
                <button type="button" className={['logo', 'logotipo'].includes(selectedCustomization?.value) ? 'selected' : ''} onClick={() => chooseCoverMode('logo')}><b>◇</b><span>Logótipo</span></button>
              </fieldset>
              <div className="configurator-fields">
                <label><span>Nº de colunas</span><select value={customDetails.columns} onChange={(event) => setCustomDetails({ ...customDetails, columns: event.target.value })}><option value="">Escolha uma opção</option>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'coluna' : 'colunas'}</option>)}</select></label>
                <label className="full"><span>Mês de início (12 meses seguidos)</span><select value={customDetails.startMonth} onChange={(event) => setCustomDetails({ ...customDetails, startMonth: event.target.value })}><option value="">Escolha uma opção</option>{startMonths.map((month) => <option key={month.value} value={month.label}>{month.label}</option>)}</select></label>
                <label className="full"><span>Horas para marcações</span><input maxLength="100" placeholder="Ex.: das 6h às 21h" value={customDetails.appointmentHours} onChange={(event) => setCustomDetails({ ...customDetails, appointmentHours: event.target.value })} /></label>
                <label className="full"><span>Como quer a capa?</span><input maxLength="500" placeholder="Descreva o tema, cores ou referência desejada" value={customDetails.coverInstructions} onChange={(event) => setCustomDetails({ ...customDetails, coverInstructions: event.target.value })} /></label>
              </div>
            </section>}

            {product.variants.length > 1 && <>
              <div className="pdp-section-title">Modelo</div>
              <select className="pdp-select" value={variantId} onChange={(event) => setVariantId(event.target.value)}>
                {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
              </select>
            </>}

            {customizable && product.options.filter((option) => !['personalizacao', 'extras', 'encadernacao', 'cor-da-capa'].includes(option.slug)).map((option, optionIndex) => (
              <details className="configurator-step" key={option.id} open>
                <summary><b>{optionIndex + 1}</b><span>{option.name}{option.required ? ' *' : ''}</span><small>{(selected[option.id] ?? []).length ? 'Escolhido' : 'Escolher'}</small></summary>
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
              </details>
            ))}

            {customizable && extrasOption && <details className="configurator-step extras-finishes" open>
              <summary><b>+</b><span>Extras e acabamentos</span><small>Escolher</small></summary>
              <div className="pdp-section-title">Extras e acabamentos</div>
              <div className="extras-list">
                {extrasOption.values.filter((value) => !['caneta', 'separadores'].includes(value.value)).map((value) => {
                  const checked = (selected[extrasOption.id] ?? []).includes(value.id);
                  return <label key={value.id} className={`extra-item ${checked ? 'checked' : ''}`}><span className="left"><input type="checkbox" checked={checked} onChange={() => { choose(extrasOption, value.id); if (value.value === 'elastico' && checked) setCustomDetails((current) => ({ ...current, elasticColor: '' })); }} />{value.name}</span>{Number(value.priceDelta) > 0 && <span className="add-price">+ {money(value.priceDelta)}</span>}</label>;
                })}
              </div>
              <div className="finish-grid">
                <label><span>Cor do elástico</span><select value={customDetails.elasticColor} onChange={(event) => chooseElasticColor(event.target.value)}><option value="">Escolha uma cor</option>{['Dourado com brilho', 'Prateado com brilho', 'Preto', 'Rosa', 'Azul', 'Verde', 'Vermelho', 'Roxo', 'Castanho'].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label><span>Cor da espiral</span><select value={customDetails.coilColor} onChange={(event) => setCustomDetails({ ...customDetails, coilColor: event.target.value })}><option value="">Escolha uma cor</option>{['Dourada', 'Prateada', 'Branca', 'Preta'].map((value) => <option key={value}>{value}</option>)}</select></label>
              </div>
              {bindingOption && <><div className="finish-subtitle">Tipo de espiral</div><div className="radio-list">{bindingOption.values.map((value) => { const checked = (selected[bindingOption.id] ?? []).includes(value.id); return <label key={value.id} className={`radio-item ${checked ? 'checked' : ''}`}><span className="left"><input type="radio" name={bindingOption.id} checked={checked} onChange={() => choose(bindingOption, value.id)} />{value.name}</span></label>; })}</div></>}
            </details>}

            {customizable && coverColorOption && <details className="configurator-step" open>
              <summary><b>●</b><span>Cor da capa</span><small>Escolher</small></summary>
              <div className="pdp-section-title">Cor da capa</div>
              <div className="cover-color-swatches">{coverColorOption.values.map((value) => { const checked = (selected[coverColorOption.id] ?? []).includes(value.id); return <button key={value.id} type="button" className={checked ? 'selected' : ''} style={{ backgroundColor: COVER_COLORS[value.value] ?? '#ddd' }} onClick={() => choose(coverColorOption, value.id)} aria-label={`Cor da capa: ${value.name}`} title={value.name} />; })}</div>
            </details>}

            {needsFile && (
              <div>
                <div className="pdp-section-title">
                  Enviar {selectedCustomization?.name} *
                </div>
                <label className="upload-box">
                  <strong>{customizationFile ? 'Trocar imagem da capa' : 'Enviar imagem para a capa'}</strong>
                  <span>JPG, PNG ou WEBP · imagem nítida e vertical recomendada</span>
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
                  A fotografia preencherá toda a capa no preview. Ao finalizar, envie também o ficheiro original no WhatsApp.
                </p>
              </div>
            )}

            {needsText && (
              <div className="field personalization-name-field">
                <label htmlFor="personalization-name">Nome / frase na capa *</label>
                <input
                  id="personalization-name"
                  type="text"
                  maxLength="32"
                  value={customizationText}
                  onChange={(event) => setCustomizationText(event.target.value)}
                  placeholder="Ex.: Maria Silva"
                />
                <span className="hint">{customizationText.length}/32 caracteres</span>
                <label htmlFor="personalization-color">Cor do texto</label>
                <div className="text-colors" id="personalization-color">
                  {['#25211e', '#fff9ef', '#c79b54', '#6f2f2f', '#315f59'].map((color) => (
                    <button key={color} type="button" className={textColor === color ? 'selected' : ''} style={{ background: color }} onClick={() => setTextColor(color)} aria-label={`Usar a cor ${color}`} />
                  ))}
                </div>
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
              {adding ? 'A adicionar...' : customizable ? 'Adicionar personalizado ao carrinho' : 'Adicionar ao carrinho'}
            </button>
            <div className="purchase-assurances"><span>Pagamento combinado com segurança</span><span>Resumo completo da personalização</span><span>Acompanhamento direto pelo WhatsApp</span></div>
            <p className="pdp-shipping-note">O preço é validado pelo servidor antes de o artigo ser adicionado. Finalize o pedido diretamente pelo WhatsApp.</p>
            <div className="pdp-specifications">
              <h2>Especificações</h2>
              <dl>
                <div><dt>Formato</dt><dd>{product.variants.find((variant) => variant.id === variantId)?.width ? `${Number(product.variants.find((variant) => variant.id === variantId).width)} × ${Number(product.variants.find((variant) => variant.id === variantId).height)} mm` : 'Conforme o modelo escolhido'}</dd></div>
                <div><dt>Páginas</dt><dd>{product.variants.find((variant) => variant.id === variantId)?.pages ?? 'Conforme o modelo'}</dd></div>
                <div><dt>Produção</dt><dd>{PRODUCTION_ESTIMATE}</dd></div>
                <div><dt>Acabamento</dt><dd>Produção artesanal</dd></div>
              </dl>
            </div>
          </div>
        </div>
        <div className="pdp-content-accordions">
          <details open><summary>Descrição</summary><p>{product.description || product.shortDesc}</p></details>
          <details><summary>O que está incluído</summary><p>Produto personalizado conforme as opções selecionadas, montagem artesanal e revisão dos detalhes antes da produção.</p></details>
          <details><summary>Personalização e ficheiros</summary><p>Use imagens nítidas e confirme a grafia do texto. O preview é ilustrativo; se a arte precisar de ajustes, entraremos em contacto antes da produção.</p></details>
          <details><summary>Produção e entrega</summary><p>A produção demora aproximadamente {PRODUCTION_ESTIMATE}. A estimativa de envio é confirmada separadamente antes do pagamento.</p></details>
        </div>
        <section className="pdp-related">
          <div className="section-head"><div><div className="eyebrow">Complete o seu conjunto</div><h2>Também pode gostar</h2></div></div>
          {relatedProducts.length > 0 ? (
            <div className="products">{relatedProducts.map((item) => <article className="related-mini" key={item.id}><Link to={`/produto/${item.slug}`}>{item.images?.[0] ? <img src={item.images[0].url} alt={item.name} loading="lazy" /> : <div>{item.name.slice(0, 1)}</div>}<span>{item.name}</span><strong>Desde {money(item.basePrice)}</strong></Link></article>)}</div>
          ) : (
            <div className="recommendation-categories">
              <Link to="/cadernos"><i>C</i><span><strong>Cadernos personalizados</strong><small>Para ideias, notas e projetos</small></span><b>Ver →</b></Link>
              <Link to="/imanes-acessorios"><i>A</i><span><strong>Acessórios</strong><small>Detalhes para completar o conjunto</small></span><b>Ver →</b></Link>
              <Link to="/brindes"><i>B</i><span><strong>Brindes personalizados</strong><small>Crie uma lembrança única</small></span><b>Ver →</b></Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
