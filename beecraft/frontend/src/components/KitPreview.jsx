const COLORS = { classico: '#234f58', moderno: '#8ebfc8', artesanal: '#c99058' };

export default function KitPreview({ name, slug, image, text, selections }) {
  const style = selections.find((item) => item.optionSlug === 'estilo')?.value?.toLowerCase() ?? 'moderno';
  const color = COLORS[style] ?? COLORS.moderno;
  const label = text || 'A SUA MARCA';
  const isFood = slug.includes('restauracao');
  const isEvent = slug.includes('eventos');
  return <div className="kit-preview" style={{ '--kit-color': color }} aria-label={`Pré-visualização de ${name}`}>
    <div className="kit-preview-scene">
      <div className="kit-sheet kit-flyer"><small>{isFood ? 'MENU' : isEvent ? 'BEM-VINDOS' : 'BEECRAFT'}</small><strong>{label}</strong><span>Feito especialmente para si</span></div>
      <div className="kit-sheet kit-card">{image ? <img src={image} alt="Arte enviada" /> : <><b>{label}</b><small>PERSONALIZADO</small></>}</div>
      <div className="kit-sheet kit-voucher"><small>VOUCHER</small><strong>{label}</strong></div>
      <div className="kit-magnet">{image ? <img src={image} alt="" /> : <b>B</b>}</div>
    </div><p>Pré-visualização ilustrativa · a arte final será confirmada antes da produção</p>
  </div>;
}
