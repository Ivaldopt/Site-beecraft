import { useCallback, useEffect, useMemo, useState } from "react";
import { api, date, money } from "./api";
import {
  Empty,
  ErrorMessage,
  Field,
  Modal,
  PageHeader,
  Stat,
} from "./components";

function useData(path) {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(path));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, load };
}

function Bars({ rows = [], valueKey, secondKey }) {
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [
      Number(row[valueKey] || 0),
      Number(row[secondKey] || 0),
    ]),
  );
  return (
    <div className="bars">
      {rows.map((row, index) => (
        <div className="bar-group" key={row.date ?? index}>
          <div>
            <i
              style={{
                height: `${Math.max(3, (Number(row[valueKey]) / max) * 100)}%`,
              }}
            />
            {secondKey && (
              <i
                className="second"
                style={{
                  height: `${Math.max(3, (Number(row[secondKey]) / max) * 100)}%`,
                }}
              />
            )}
          </div>
          <span>
            {row.date
              ? new Date(row.date).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "short",
                })
              : index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [period, setPeriod] = useState("daily");
  const { data, loading, error } = useData(`/dashboard?period=${period}`);
  const info = data.indicators ?? {};
  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        action={
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        }
      />
      {loading ? (
        <Empty>A carregar indicadores...</Empty>
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <div className="stats">
            <Stat
              label="Faturação do mês"
              value={money(info.monthly_revenue)}
            />
            <Stat
              label="Lucro do mês"
              value={money(info.monthly_profit)}
              tone="green"
            />
            <Stat label="Ticket médio" value={money(info.average_ticket)} />
            <Stat label="Clientes ativos" value={info.active_customers ?? 0} />
          </div>
          <div className="dashboard-grid">
            <section className="panel chart">
              <h2>Vendas e lucro</h2>
              <Bars
                rows={data.sales_series}
                valueKey="sales"
                secondKey="profit"
              />
              <footer>
                <span>
                  <i /> Vendas
                </span>
                <span>
                  <i className="second" /> Lucro
                </span>
              </footer>
            </section>
            <section className="panel chart">
              <h2>Entradas vs. saídas</h2>
              <Bars
                rows={data.stock_flow}
                valueKey="incoming"
                secondKey="outgoing"
              />
            </section>
            <section className="panel">
              <h2>Mais vendidos</h2>
              {data.top_products?.length ? (
                data.top_products.map((item, i) => (
                  <div className="rank" key={item.product_id}>
                    <b>{i + 1}</b>
                    <span>{item.product_name}</span>
                    <strong>
                      {item.units} un. · {money(item.profit)}
                    </strong>
                  </div>
                ))
              ) : (
                <Empty />
              )}
            </section>
            <section className="panel">
              <h2>Alertas de stock</h2>
              {data.low_stock?.length ? (
                data.low_stock.map((item) => (
                  <div className="alert-row" key={item.id}>
                    <span>{item.name}</span>
                    <strong>
                      {Number(item.stock_quantity)} {item.unit}
                    </strong>
                  </div>
                ))
              ) : (
                <Empty>Stock em níveis seguros.</Empty>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function SimpleCreate({ title, fields, onSubmit, onClose }) {
  const [form, setForm] = useState(
    Object.fromEntries(fields.map((f) => [f.name, f.default ?? ""])),
  );
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      await onSubmit(form);
      onClose(true);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Modal title={title} onClose={() => onClose(false)}>
      <form className="form-grid" onSubmit={submit}>
        {fields.map((field) => (
          <Field key={field.name} label={field.label}>
            {field.type === "select" ? (
              <select
                value={form[field.name]}
                required={field.required}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                value={form[field.name]}
                required={field.required}
                step={field.step}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              />
            )}
          </Field>
        ))}
        <ErrorMessage error={error} />
        <button className="primary wide">Guardar</button>
      </form>
    </Modal>
  );
}

export function Customers() {
  const { data, error, loading, load } = useData("/customers");
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  async function remove(row) { if (!confirm(`Eliminar o cliente “${row.name}”?`)) return; try { await api(`/customers/${row.id}`, { method: "DELETE" }); load(); } catch (requestError) { setActionError(requestError.message); } }
  const fields = [
    { name: "name", label: "Nome", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Telefone" },
    { name: "address", label: "Morada" },
    {
      name: "segment",
      label: "Segmento",
      type: "select",
      default: "NEW",
      options: ["NEW", "RECURRING", "VIP", "INACTIVE"].map((v) => ({
        value: v,
        label: {
          NEW: "Novo",
          RECURRING: "Recorrente",
          VIP: "VIP",
          INACTIVE: "Inativo",
        }[v],
      })),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        action={
          <button className="primary" onClick={() => setOpen(true)}>
            + Novo cliente
          </button>
        }
      />
      <ErrorMessage error={error || actionError} />
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : data.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Segmento</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <small>{row.email}</small>
                  </td>
                  <td>{row.phone || "—"}</td>
                  <td>
                    <span className={`tag ${row.segment.toLowerCase()}`}>
                      {row.segment}
                    </span>
                  </td>
                  <td>{date(row.created_at)}</td>
                  <td><button className="danger-button" onClick={() => remove(row)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      )}
      {open && (
        <SimpleCreate
          title="Novo cliente"
          fields={fields}
          onSubmit={(form) =>
            api("/customers", {
              method: "POST",
              body: JSON.stringify({
                ...form,
                email: form.email || null,
                phone: form.phone || null,
                address: form.address || null,
              }),
            })
          }
          onClose={(saved) => {
            setOpen(false);
            if (saved) load();
          }}
        />
      )}
    </>
  );
}

export function Stock() {
  const { data, error, loading, load } = useData("/inventory");
  const { data: movements, load: loadMovements } = useData(
    "/stock/movements?limit=30",
  );
  const [open, setOpen] = useState(false);
  const [movement, setMovement] = useState(false);
  const [actionError, setActionError] = useState("");
  async function removeItem(row) { if (!confirm(`Eliminar “${row.name}” do stock?`)) return; try { await api(`/inventory/${row.id}`, { method: "DELETE" }); load(); } catch (requestError) { setActionError(requestError.message); } }
  async function removeMovement(row) { if (!confirm("Anular este movimento de stock? A quantidade será corrigida automaticamente.")) return; try { await api(`/stock/movements/${row.id}`, { method: "DELETE" }); load(); loadMovements(); } catch (requestError) { setActionError(requestError.message); } }
  const itemFields = [
    { name: "sku", label: "SKU", required: true },
    { name: "name", label: "Nome", required: true },
    {
      name: "item_type",
      label: "Tipo",
      type: "select",
      default: "RAW_MATERIAL",
      options: [
        { value: "RAW_MATERIAL", label: "Matéria-prima" },
        { value: "FINISHED_PRODUCT", label: "Produto acabado" },
      ],
    },
    { name: "unit", label: "Unidade", required: true },
    {
      name: "minimum_stock",
      label: "Stock mínimo",
      type: "number",
      step: "0.0001",
      default: "0",
    },
    {
      name: "average_cost",
      label: "Custo unitário",
      type: "number",
      step: "0.0001",
      default: "0",
    },
  ];
  const movementFields = [
    {
      name: "inventory_item_id",
      label: "Item",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Selecione..." },
        ...data.map((x) => ({ value: x.id, label: x.name })),
      ],
    },
    {
      name: "movement_type",
      label: "Movimento",
      type: "select",
      default: "IN",
      options: [
        { value: "IN", label: "Entrada" },
        { value: "OUT", label: "Saída" },
      ],
    },
    {
      name: "reason",
      label: "Motivo",
      type: "select",
      default: "ADJUSTMENT",
      options: ["ADJUSTMENT", "LOSS", "INTERNAL_USE", "PRODUCTION"].map(
        (v) => ({ value: v, label: v }),
      ),
    },
    {
      name: "quantity",
      label: "Quantidade",
      type: "number",
      step: "0.0001",
      required: true,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Inventário"
        title="Stock"
        action={
          <div className="actions">
            <button onClick={() => setMovement(true)}>Movimentar</button>
            <button className="primary" onClick={() => setOpen(true)}>
              + Novo item
            </button>
          </div>
        }
      />
      <ErrorMessage error={error || actionError} />
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : (
        <div className="stock-grid">
          <section className="panel">
            <h2>Posição atual</h2>
            {data.map((item) => (
              <div
                className={`stock-row ${Number(item.stock_quantity) <= Number(item.minimum_stock) ? "low" : ""}`}
                key={item.id}
              >
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.sku} · {item.item_type === "RAW_MATERIAL" ? "Matéria-prima" : "Produto acabado"} · mínimo {Number(item.minimum_stock)} {item.unit} · custo {money(item.average_cost)}
                  </small>
                </div>
                <b>
                  {Number(item.stock_quantity)} {item.unit}
                </b>
                <button className="danger-button icon-action" onClick={() => removeItem(item)} title="Excluir item">×</button>
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>Últimos movimentos</h2>
            {movements.length ? (
              movements.map((row) => (
                <div className="movement" key={row.id}>
                  <i className={row.movement_type.toLowerCase()}>
                    {row.movement_type === "IN" ? "↑" : "↓"}
                  </i>
                  <span>
                    {row.reason}
                    <small>{date(row.occurred_at)}</small>
                  </span>
                  <b>{Number(row.quantity)}</b>
                  <button className="danger-button icon-action" onClick={() => removeMovement(row)} title="Anular movimento">×</button>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </section>
        </div>
      )}
      {open && (
        <SimpleCreate
          title="Novo item de stock"
          fields={itemFields}
          onSubmit={(form) =>
            api("/inventory", { method: "POST", body: JSON.stringify(form) })
          }
          onClose={(saved) => {
            setOpen(false);
            if (saved) load();
          }}
        />
      )}
      {movement && (
        <SimpleCreate
          title="Movimento de stock"
          fields={movementFields}
          onSubmit={(form) =>
            api("/stock/movements", {
              method: "POST",
              body: JSON.stringify({
                ...form,
                quantity: Number(form.quantity),
                occurred_at: new Date().toISOString(),
              }),
            })
          }
          onClose={(saved) => {
            setMovement(false);
            if (saved) {
              load();
              loadMovements();
            }
          }}
        />
      )}
    </>
  );
}

export function Products() {
  const { data, error, loading, load } = useData("/products");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [margin, setMargin] = useState(30);
  const [actionError, setActionError] = useState("");
  async function remove(product) { if (!confirm(`Excluir o produto “${product.name}”?`)) return; try { await api(`/products/${product.id}`, { method: "DELETE" }); load(); } catch (requestError) { setActionError(requestError.message); } }
  async function simulate(product) {
    setSelected(product);
    setMargin(Number(product.desired_margin));
    setSimulation(await api(`/products/${product.id}/cost`));
  }
  const fields = [
    { name: "sku", label: "SKU", required: true },
    { name: "name", label: "Nome", required: true },
    {
      name: "labor_cost",
      label: "Mão de obra",
      type: "number",
      step: "0.01",
      default: "0",
    },
    {
      name: "packaging_cost",
      label: "Embalagem",
      type: "number",
      step: "0.01",
      default: "0",
    },
    {
      name: "desired_margin",
      label: "Margem (%)",
      type: "number",
      step: "0.01",
      default: "30",
    },
  ];
  const simulatedPrice = simulation
    ? Number(simulation.total_cost) / (1 - margin / 100)
    : 0;
  return (
    <>
      <PageHeader
        eyebrow="Ficha técnica"
        title="Produtos e preços"
        action={
          <button className="primary" onClick={() => setOpen(true)}>
            + Novo produto
          </button>
        }
      />
      <ErrorMessage error={error || actionError} />
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : data.length ? (
        <div className="cards">
          {data.map((p) => (
            <article className="product-admin" key={p.id}>
              <span>{p.sku}</span>
              <h3>{p.name}</h3>
              <strong>{money(p.current_price)}</strong>
              <small>Margem {Number(p.desired_margin)}%</small>
              <div className="card-actions"><button onClick={() => simulate(p)}>Simular preço</button><button className="danger-button" onClick={() => remove(p)}>Excluir</button></div>
            </article>
          ))}
        </div>
      ) : (
        <Empty />
      )}
      {open && (
        <SimpleCreate
          title="Novo produto"
          fields={fields}
          onSubmit={(form) =>
            api("/products", {
              method: "POST",
              body: JSON.stringify({
                ...form,
                labor_cost: Number(form.labor_cost),
                packaging_cost: Number(form.packaging_cost),
                desired_margin: Number(form.desired_margin),
                materials: [],
              }),
            })
          }
          onClose={(saved) => {
            setOpen(false);
            if (saved) load();
          }}
        />
      )}
      {selected && (
        <Modal
          title={`Simulador — ${selected.name}`}
          onClose={() => setSelected(null)}
        >
          <div className="simulator">
            <Stat label="Custo atual" value={money(simulation?.total_cost)} />
            <Field label={`Margem desejada: ${margin}%`}>
              <input
                type="range"
                min="0"
                max="90"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
            </Field>
            <div className="sim-price">
              <span>Novo preço</span>
              <strong>{money(simulatedPrice)}</strong>
            </div>
            <button
              className="primary wide"
              onClick={async () => {
                await api(`/products/${selected.id}/apply-price`, {
                  method: "POST",
                  body: JSON.stringify({
                    margin_percent: margin,
                    extra_cost: 0,
                  }),
                });
                setSelected(null);
                load();
              }}
            >
              Aplicar preço
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

const emptyStoreProduct = {
  name: "", slug: "", shortDesc: "", description: "", basePrice: 0,
  categoryId: "", status: "DRAFT", saleType: "CUSTOMIZABLE", variants: [], options: [], images: [],
};

export function StoreCatalog() {
  const { data: products, error, loading, load } = useData("/store-catalog/products");
  const { data: categories } = useData("/store-catalog/categories");
  const [editing, setEditing] = useState(null);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function edit(product = emptyStoreProduct) {
    setEditing(JSON.parse(JSON.stringify({ ...emptyStoreProduct, ...product, categoryId: product.categoryId || product.category?.id || categories[0]?.id || "" })));
    setFiles([]); setFormError("");
  }
  function field(name, value) { setEditing((current) => ({ ...current, [name]: value })); }
  function variantField(index, name, value) { setEditing((current) => ({ ...current, variants: current.variants.map((row, rowIndex) => rowIndex === index ? { ...row, [name]: value } : row) })); }
  function optionField(index, name, value) { setEditing((current) => ({ ...current, options: current.options.map((row, rowIndex) => rowIndex === index ? { ...row, [name]: value } : row) })); }
  function valueField(optionIndex, valueIndex, name, value) { setEditing((current) => ({ ...current, options: current.options.map((option, currentOption) => currentOption === optionIndex ? { ...option, values: option.values.map((row, currentValue) => currentValue === valueIndex ? { ...row, [name]: value } : row) } : option) })); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setFormError("");
    try {
      const payload = { ...editing, status: editing.status === "ARCHIVED" ? "INACTIVE" : editing.status, basePrice: Number(editing.basePrice), images: undefined, category: undefined, createdAt: undefined, updatedAt: undefined,
        variants: editing.variants.map((row) => ({ ...row, price: row.price === "" || row.price == null ? undefined : Number(row.price), width: row.width ? Number(row.width) : undefined, height: row.height ? Number(row.height) : undefined, pages: row.pages ? Number(row.pages) : undefined })),
        options: editing.options.map((option) => ({ ...option, values: option.values.map((row) => ({ ...row, priceDelta: Number(row.priceDelta || 0) })) })),
      };
      const saved = await api(editing.id ? `/store-catalog/products/${editing.id}` : "/store-catalog/products", { method: editing.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (files.length) { const body = new FormData(); files.forEach((file) => body.append("files", file)); await api(`/store-catalog/products/${saved.id}/images`, { method: "POST", body }); }
      setEditing(null); load();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSaving(false); }
  }
  async function removeImage(imageId) { if (!confirm("Eliminar esta fotografia?")) return; await api(`/store-catalog/images/${imageId}`, { method: "DELETE" }); edit({ ...editing, images: editing.images.filter((image) => image.id !== imageId) }); load(); }
  async function removeProduct(product) { if (!confirm(`Excluir “${product.name}” da loja?`)) return; try { await api(`/store-catalog/products/${product.id}`, { method: "DELETE" }); load(); } catch (requestError) { setFormError(requestError.message); } }

  return <><PageHeader eyebrow="Loja pública" title="Catálogo da loja" action={<button className="primary" onClick={() => edit()}>+ Novo produto</button>} /><p className="catalog-note">Edite aqui tudo o que o cliente vê na loja: textos, preços, formatos, personalizações e fotografias.</p><ErrorMessage error={error} />
    {loading ? <Empty>A carregar catálogo...</Empty> : <div className="store-products">{products.map((product) => <article key={product.id}><div className="store-thumb">{product.images?.[0] ? <img src={product.images[0].url} alt="" /> : <span>Sem foto</span>}</div><div><small>{product.category?.name} · {product.status}</small><h3>{product.name}</h3><b>{money(product.basePrice)}</b><p>{product.shortDesc}</p></div><div className="store-product-actions"><button onClick={() => edit(product)}>Editar</button><button className="danger-button" onClick={() => removeProduct(product)}>Excluir</button></div></article>)}</div>}
    {editing && <Modal title={editing.id ? `Editar — ${editing.name}` : "Novo produto da loja"} onClose={() => setEditing(null)}><form className="store-editor" onSubmit={save}>
      <div className="store-editor-grid"><Field label="Nome *"><input required value={editing.name} onChange={(event) => field("name", event.target.value)} /></Field><Field label="Slug / endereço *"><input required pattern="[a-z0-9-]+" value={editing.slug} onChange={(event) => field("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field><Field label="Categoria *"><select required value={editing.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="">Escolher</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Preço base (€) *"><input required type="number" min="0" step="0.01" value={editing.basePrice} onChange={(event) => field("basePrice", event.target.value)} /></Field><Field label="Estado"><select value={editing.status} onChange={(event) => field("status", event.target.value)}><option value="DRAFT">Rascunho</option><option value="ACTIVE">Publicado</option><option value="ARCHIVED">Arquivado</option></select></Field><Field label="Tipo de venda"><select value={editing.saleType} onChange={(event) => field("saleType", event.target.value)}><option value="CUSTOMIZABLE">Personalizável</option><option value="READY_MADE">Produto pronto</option></select></Field><Field label="Descrição curta"><textarea rows="2" value={editing.shortDesc || ""} onChange={(event) => field("shortDesc", event.target.value)} /></Field><Field label="Descrição completa"><textarea rows="3" value={editing.description || ""} onChange={(event) => field("description", event.target.value)} /></Field></div>
      <section className="editor-section"><header><div><h3>Fotografias</h3><small>JPG, PNG ou WebP, até 8 MB cada</small></div></header><div className="admin-gallery">{editing.images.map((image) => <div key={image.id}><img src={image.url} alt={image.alt || editing.name} /><button type="button" onClick={() => removeImage(image.id)}>×</button></div>)}<label className="admin-upload">+ Adicionar fotos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles([...event.target.files])} /></label></div>{files.length > 0 && <small>{files.length} nova(s) fotografia(s) selecionada(s)</small>}</section>
      <section className="editor-section"><header><div><h3>Formatos e variantes</h3><small>Ex.: 25 unidades, A4, A5 ou pacote profissional</small></div><button type="button" onClick={() => field("variants", [...editing.variants, { name: "", sku: "", price: editing.basePrice, active: true }])}>+ Variante</button></header>{editing.variants.map((variant, index) => <div className="editor-row" key={variant.id || index}><input placeholder="Nome" value={variant.name} onChange={(event) => variantField(index, "name", event.target.value)} /><input placeholder="SKU" value={variant.sku} onChange={(event) => variantField(index, "sku", event.target.value)} /><input type="number" step="0.01" placeholder="Preço" value={variant.price ?? ""} onChange={(event) => variantField(index, "price", event.target.value)} /><button type="button" onClick={() => field("variants", editing.variants.filter((_, row) => row !== index))}>Remover</button></div>)}</section>
      <section className="editor-section"><header><div><h3>Opções de personalização</h3><small>Acabamento, cor, papel, extras e outras escolhas</small></div><button type="button" onClick={() => field("options", [...editing.options, { name: "", slug: "", type: "SELECT", required: false, values: [] }])}>+ Opção</button></header>{editing.options.map((option, optionIndex) => <div className="admin-option" key={option.id || optionIndex}><div className="editor-row"><input placeholder="Nome da opção" value={option.name} onChange={(event) => optionField(optionIndex, "name", event.target.value)} /><input placeholder="slug-da-opcao" value={option.slug} onChange={(event) => optionField(optionIndex, "slug", event.target.value)} /><label><input type="checkbox" checked={option.required} onChange={(event) => optionField(optionIndex, "required", event.target.checked)} /> Obrigatória</label><button type="button" onClick={() => field("options", editing.options.filter((_, row) => row !== optionIndex))}>Remover</button></div>{option.values.map((value, valueIndex) => <div className="editor-value" key={value.id || valueIndex}><input placeholder="Escolha apresentada" value={value.name} onChange={(event) => valueField(optionIndex, valueIndex, "name", event.target.value)} /><input placeholder="valor" value={value.value || ""} onChange={(event) => valueField(optionIndex, valueIndex, "value", event.target.value)} /><input type="number" step="0.01" placeholder="Acréscimo €" value={value.priceDelta ?? 0} onChange={(event) => valueField(optionIndex, valueIndex, "priceDelta", event.target.value)} /><button type="button" onClick={() => optionField(optionIndex, "values", option.values.filter((_, row) => row !== valueIndex))}>×</button></div>)}<button type="button" onClick={() => optionField(optionIndex, "values", [...option.values, { name: "", value: "", priceDelta: 0, active: true }])}>+ Adicionar escolha</button></div>)}</section>
      <ErrorMessage error={formError} /><div className="modal-actions"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "A guardar..." : "Guardar produto"}</button></div>
    </form></Modal>}
  </>;
}

export function StoreCategories() {
  const { data, error, loading, load } = useData("/store-catalog/categories/admin");
  const [ordered, setOrdered] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [dragged, setDragged] = useState(null);
  const [orderSaved, setOrderSaved] = useState("");
  useEffect(() => { setOrdered(data); }, [data]);
  const blank = { name: "", slug: "", description: "", image: "", active: true, sortOrder: ordered.length };
  async function save(event) {
    event.preventDefault(); setFormError("");
    try { await api(editing.id ? `/store-catalog/categories/${editing.id}` : "/store-catalog/categories", { method: editing.id ? "PATCH" : "POST", body: JSON.stringify(editing) }); setEditing(null); load(); }
    catch (requestError) { setFormError(requestError.message); }
  }
  function drop(targetId) { const from = ordered.findIndex((row) => row.id === dragged); const to = ordered.findIndex((row) => row.id === targetId); if (from < 0 || to < 0) return; const next = [...ordered]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setOrdered(next); setDragged(null); setOrderSaved(""); }
  async function saveOrder() { setOrderSaved(""); try { await Promise.all(ordered.map((category, index) => api(`/store-catalog/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ name: category.name, slug: category.slug, description: category.description, image: category.image, active: category.active, sortOrder: index }) }))); setOrderSaved("Ordem guardada."); load(); } catch (requestError) { setFormError(requestError.message); } }
  return <><PageHeader eyebrow="Organização do catálogo" title="Categorias" action={<div className="actions"><button onClick={saveOrder}>Guardar ordem</button><button className="primary" onClick={() => setEditing(blank)}>+ Nova categoria</button></div>} /><p className="catalog-note">Arraste as categorias para definir a ordem apresentada na loja.</p>{orderSaved && <p className="success">{orderSaved}</p>}<ErrorMessage error={error || formError} />{loading ? <Empty>A carregar...</Empty> : <div className="category-order-list">{ordered.map((category, index) => <article key={category.id} draggable onDragStart={() => setDragged(category.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(category.id)}><span className="drag-handle">⋮⋮</span><b className="order-number">{index + 1}</b>{category.image ? <img src={category.image} alt="" /> : <div className="category-placeholder">{category.name[0]}</div>}<div><small>{category.active ? "Visível" : "Oculta"} · {category._count?.products || 0} produtos</small><h3>{category.name}</h3><p>{category.description}</p></div><button onClick={() => setEditing({ ...category, _count: undefined })}>Editar</button></article>)}</div>}
    {editing && <Modal title={editing.id ? "Editar categoria" : "Nova categoria"} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={save}><Field label="Nome *"><input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field><Field label="Slug *"><input required pattern="[a-z0-9-]+" value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></Field><Field label="Descrição"><textarea rows="3" value={editing.description || ""} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></Field><Field label="URL da imagem"><input type="url" value={editing.image || ""} onChange={(event) => setEditing({ ...editing, image: event.target.value })} /></Field><label className="wide"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Categoria visível na loja</label><ErrorMessage error={formError} /><div className="modal-actions wide"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="primary">Guardar categoria</button></div></form></Modal>}
  </>;
}

export function Sales() {
  const { data, error, loading, load } = useData("/sales");
  const { data: products } = useData("/products");
  const { data: customers } = useData("/customers");
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  async function remove(row) { if (!confirm(`Excluir a venda ${row.number}? O stock utilizado será devolvido.`)) return; try { await api(`/sales/${row.id}`, { method: "DELETE" }); load(); } catch (requestError) { setActionError(requestError.message); } }
  async function receipt(row) {
    const response = await api(`/reports/sales/${row.id}/receipt.pdf`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  const fields = [
    {
      name: "customer_id",
      label: "Cliente",
      type: "select",
      options: [
        { value: "", label: "Consumidor final" },
        ...customers.map((x) => ({ value: x.id, label: x.name })),
      ],
    },
    {
      name: "product_id",
      label: "Produto",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Selecione..." },
        ...products.map((x) => ({
          value: x.id,
          label: `${x.name} — ${money(x.current_price)}`,
        })),
      ],
    },
    {
      name: "quantity",
      label: "Quantidade",
      type: "number",
      default: "1",
      required: true,
    },
    {
      name: "payment_method",
      label: "Pagamento",
      type: "select",
      default: "MBWAY",
      options: ["MBWAY", "CASH", "CARD", "TRANSFER", "OTHER"].map((x) => ({
        value: x,
        label: x,
      })),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Vendas"
        action={
          <button className="primary" onClick={() => setOpen(true)}>
            + Registar venda
          </button>
        }
      />
      <ErrorMessage error={error || actionError} />
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : data.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Venda</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Lucro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.number}</strong>
                  </td>
                  <td>{date(row.sold_at)}</td>
                  <td>{row.customer?.name || "Consumidor final"}</td>
                  <td>{row.payment_method}</td>
                  <td>{money(row.total)}</td>
                  <td className="profit">{money(row.net_profit)}</td>
                  <td>
                    <div className="table-actions"><button onClick={() => receipt(row)}>PDF</button><button className="danger-button" onClick={() => remove(row)}>Excluir</button></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      )}
      {open && (
        <SimpleCreate
          title="Registar venda"
          fields={fields}
          onSubmit={(form) =>
            api("/sales", {
              method: "POST",
              body: JSON.stringify({
                customer_id: form.customer_id || null,
                payment_method: form.payment_method,
                sold_at: new Date().toISOString(),
                items: [
                  {
                    product_id: form.product_id,
                    quantity: Number(form.quantity),
                    configuration: {},
                  },
                ],
              }),
            })
          }
          onClose={(saved) => {
            setOpen(false);
            if (saved) load();
          }}
        />
      )}
    </>
  );
}

const productionColumns = [
  { key: "ARTWORK", label: "Criando arte", color: "#ec4899" },
  { key: "OPEN", label: "Em aberto", color: "#eab308" },
  { key: "PRODUCTION", label: "Em produção", color: "#a855f7" },
  { key: "PICKUP", label: "Aguardando retirada", color: "#22c4d6" },
  { key: "SHIPPING", label: "Em transporte", color: "#3b82f6" },
  { key: "DELIVERED", label: "Entregue", color: "#10b981" },
  { key: "PAYMENT", label: "Aguardando pagamento", color: "#f97316" },
];

export function ProductionBoard() {
  const today = new Date().toISOString().slice(0, 10);
  const [day, setDay] = useState(today);
  const [query, setQuery] = useState("");
  const { data, error, loading, load } = useData(`/production/board?production_date=${day}`);
  const visible = data.filter((sale) => `${sale.number} ${sale.customer?.name || ""} ${sale.items?.map((item) => item.product?.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const completed = data.filter((sale) => sale.production_status === "DELIVERED").length;
  const active = data.filter((sale) => !["DELIVERED", "PAYMENT"].includes(sale.production_status)).length;

  async function move(saleId, status) {
    await api(`/production/${saleId}`, { method: "PATCH", body: JSON.stringify({ status, production_date: day }) });
    load();
  }
  return <><PageHeader eyebrow="Operação diária" title="Produção do dia" action={<div className="production-date"><button onClick={() => setDay(today)}>Hoje</button><input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></div>} />
    <div className="production-summary"><Stat label="Encomendas do dia" value={data.length} /><Stat label="Em andamento" value={active} /><Stat label="Concluídas" value={completed} tone="green" /><Stat label="Valor do dia" value={money(data.reduce((sum, sale) => sum + Number(sale.total), 0))} /></div>
    <div className="production-toolbar"><div><strong>Painel de encomendas</strong><span>Arraste os cartões entre as etapas</span></div><input type="search" placeholder="Buscar por encomenda, cliente ou produto" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <ErrorMessage error={error} />{loading ? <Empty>A carregar produção...</Empty> : <div className="production-board">{productionColumns.map((column) => { const cards = visible.filter((sale) => (sale.production_status || "OPEN") === column.key); return <section className="kanban-column" key={column.key} style={{ "--column-color": column.color }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => move(event.dataTransfer.getData("saleId"), column.key)}><header><div><i />{column.label}</div><b>{cards.length}</b></header><div className="kanban-list">{cards.length ? cards.map((sale) => <article className="production-card" key={sale.id} draggable onDragStart={(event) => event.dataTransfer.setData("saleId", sale.id)}><div className="production-card-top"><strong>{sale.number}</strong><span>{money(sale.total)}</span></div><h3>{sale.customer?.name || "Consumidor final"}</h3><ul>{sale.items?.map((item) => <li key={item.id}>{item.quantity}× {item.product?.name || "Produto"}</li>)}</ul><footer><small>{sale.payment_method}</small><select aria-label="Alterar etapa" value={sale.production_status || "OPEN"} onChange={(event) => move(sale.id, event.target.value)}>{productionColumns.map((option) => <option value={option.key} key={option.key}>{option.label}</option>)}</select></footer></article>) : <div className="kanban-empty">Nenhuma encomenda</div>}</div></section>; })}</div>}
  </>;
}

export function Purchases() {
  const { data, error, loading, load } = useData("/purchases");
  const { data: suppliers, load: loadSuppliers } = useData("/suppliers");
  const { data: inventory, load: loadStock } = useData("/inventory");
  const [open, setOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  async function remove(row) { if (!confirm(`Excluir a compra ${row.number}? A entrada será retirada do stock.`)) return; try { await api(`/purchases/${row.id}`, { method: "DELETE" }); load(); loadStock(); } catch (requestError) { setActionError(requestError.message); } }
  const fields = [
    {
      name: "supplier_id",
      label: "Fornecedor",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Selecione..." },
        ...suppliers.map((x) => ({ value: x.id, label: x.name })),
      ],
    },
    {
      name: "inventory_item_id",
      label: "Matéria-prima",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Selecione..." },
        ...inventory.map((x) => ({ value: x.id, label: x.name })),
      ],
    },
    {
      name: "quantity",
      label: "Quantidade",
      type: "number",
      step: "0.0001",
      required: true,
    },
    {
      name: "unit_cost",
      label: "Custo unitário",
      type: "number",
      step: "0.0001",
      required: true,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Aprovisionamento"
        title="Compras"
        action={
          <div className="actions">
            <button onClick={() => setSupplierOpen(true)}>+ Fornecedor</button>
            <button className="primary" onClick={() => setOpen(true)}>
              + Registar compra
            </button>
          </div>
        }
      />
      <ErrorMessage error={error || actionError} />
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : data.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Compra</th>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Itens</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.number}</strong>
                  </td>
                  <td>{date(row.purchased_at)}</td>
                  <td>{row.supplier?.name}</td>
                  <td>{row.items?.length}</td>
                  <td>{money(row.total)}</td>
                  <td><button className="danger-button" onClick={() => remove(row)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      )}
      {open && (
        <SimpleCreate
          title="Registar compra"
          fields={fields}
          onSubmit={(form) =>
            api("/purchases", {
              method: "POST",
              body: JSON.stringify({
                supplier_id: form.supplier_id,
                purchased_at: new Date().toISOString(),
                items: [
                  {
                    inventory_item_id: form.inventory_item_id,
                    quantity: Number(form.quantity),
                    unit_cost: Number(form.unit_cost),
                  },
                ],
              }),
            })
          }
          onClose={(saved) => {
            setOpen(false);
            if (saved) {
              load();
              loadStock();
            }
          }}
        />
      )}{" "}
      {supplierOpen && (
        <SimpleCreate
          title="Novo fornecedor"
          fields={[
            { name: "name", label: "Nome", required: true },
            { name: "contact_name", label: "Pessoa de contacto" },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Telefone" },
          ]}
          onSubmit={(form) =>
            api("/suppliers", {
              method: "POST",
              body: JSON.stringify({ ...form, email: form.email || null }),
            })
          }
          onClose={(saved) => {
            setSupplierOpen(false);
            if (saved) loadSuppliers();
          }}
        />
      )}
    </>
  );
}

export function Reports() {
  const url = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
  async function downloadCsv() {
    const response = await api("/reports/sales.csv");
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vendas.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <>
      <PageHeader eyebrow="Análise" title="Relatórios" />
      <div className="report-grid">
        <article className="panel report">
          <span>CSV</span>
          <h2>Relatório de vendas</h2>
          <p>Exporta vendas, custos e lucro para Excel ou Google Sheets.</p>
          <button className="primary" onClick={downloadCsv}>
            Descarregar CSV
          </button>
        </article>
        <article className="panel report">
          <span>API</span>
          <h2>Documentação</h2>
          <p>Consulte e teste todos os endpoints REST no Swagger.</p>
          <a
            className="button"
            href={url.replace(/\/api$/, "/docs")}
            target="_blank"
            rel="noreferrer"
          >
            Abrir Swagger
          </a>
        </article>
      </div>
    </>
  );
}

const numberValue = (value) => Math.max(0, Number(value) || 0);

export function PricingCalculator() {
  const [mode, setMode] = useState("own");
  const [form, setForm] = useState({ name: "", quantity: 1, materials: 8, laborHours: 1, hourlyRate: 10, machine: 1, supplierTotal: 0, width: 21, height: 29.7, squareMeter: 12, shipping: 0, packaging: 1, other: 0, waste: 5, margin: 35, vat: 23 });
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const result = useMemo(() => {
    const quantity = Math.max(1, numberValue(form.quantity));
    let production = 0;
    if (mode === "bought") production = numberValue(form.supplierTotal);
    if (mode === "own") production = numberValue(form.materials) + numberValue(form.laborHours) * numberValue(form.hourlyRate) + numberValue(form.machine);
    if (mode === "area") production = (numberValue(form.width) / 100) * (numberValue(form.height) / 100) * numberValue(form.squareMeter) * quantity;
    production *= 1 + numberValue(form.waste) / 100;
    const cost = production + numberValue(form.shipping) + numberValue(form.packaging) * quantity + numberValue(form.other);
    const margin = Math.min(95, numberValue(form.margin)) / 100;
    const net = cost / (1 - margin);
    const vat = net * numberValue(form.vat) / 100;
    return { cost, net, vat, total: net + vat, unit: (net + vat) / quantity, profit: net - cost, quantity };
  }, [form, mode]);
  function input(name, label, suffix = "€") { return <Field label={label}><div className="input-suffix"><input type="number" min="0" step="0.01" value={form[name]} onChange={(event) => set(name, event.target.value)} /><span>{suffix}</span></div></Field>; }
  function saveCalculation() { const saved = JSON.parse(localStorage.getItem("beecraft-pricing-history") || "[]"); localStorage.setItem("beecraft-pricing-history", JSON.stringify([{ ...form, mode, savedAt: new Date().toISOString(), result }, ...saved].slice(0, 20))); }
  return <><PageHeader eyebrow="Custos e margens" title="Calculadora de preços" /><div className="calculator-tabs">{[["bought","Produto comprado"],["own","Produção própria"],["area","Por metro quadrado"]].map(([key,label]) => <button className={mode === key ? "active" : ""} onClick={() => setMode(key)} key={key}>{label}</button>)}</div><div className="pricing-layout"><section className="panel pricing-form"><h2>Custos do produto</h2><Field label="Nome do produto"><input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ex.: Agenda A5 personalizada" /></Field><div className="form-grid">{input("quantity","Quantidade","un.")}{mode === "bought" && input("supplierTotal","Custo total do fornecedor")}{mode === "own" && <>{input("materials","Matérias-primas")}{input("laborHours","Horas de trabalho","h")}{input("hourlyRate","Valor por hora")}{input("machine","Máquina e energia")}</>}{mode === "area" && <>{input("width","Largura","cm")}{input("height","Altura","cm")}{input("squareMeter","Custo por m²","€/m²")}</>}{input("shipping","Transporte / entrega")}{input("packaging","Embalagem por unidade")}{input("other","Outros custos")}{input("waste","Desperdício","%")}</div><hr/><h2>Margem e impostos</h2><div className="form-grid">{input("margin","Margem desejada","%")}{input("vat","IVA aplicável","%")}</div><p className="field-help">A margem é calculada sobre o preço de venda. Confirme a taxa de IVA aplicável ao produto e à região com a contabilidade.</p></section><aside className="pricing-result"><small>RESULTADO</small><h2>{form.name || "Novo produto"}</h2><dl><div><dt>Custo total</dt><dd>{money(result.cost)}</dd></div><div><dt>Lucro antes de IVA</dt><dd className="profit">+ {money(result.profit)}</dd></div><div><dt>Preço sem IVA</dt><dd>{money(result.net)}</dd></div><div><dt>IVA</dt><dd>{money(result.vat)}</dd></div></dl><div className="pricing-total"><span>Preço total de venda</span><strong>{money(result.total)}</strong><small>{money(result.unit)} por unidade · {result.quantity} un.</small></div><div className="actions"><button onClick={() => navigator.clipboard?.writeText(result.total.toFixed(2))}>Copiar preço</button><button className="primary" onClick={saveCalculation}>Guardar cálculo</button></div></aside></div></>;
}

export function CatalogMetrics() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useData(`/metrics/catalog?days=${days}`);
  const totals = data.totals || {};
  return <><PageHeader eyebrow="Desempenho da loja" title="Métricas do catálogo" action={<select value={days} onChange={(event) => setDays(event.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select>} />{error ? <ErrorMessage error={error} /> : loading ? <Empty>A carregar métricas...</Empty> : <><div className="stats metric-stats"><Stat label="Visitas" value={totals.visits || 0} /><Stat label="Visitantes únicos" value={totals.unique_visitors || 0} /><Stat label="Visualizações de produtos" value={totals.product_views || 0} /><Stat label="Adições ao carrinho" value={totals.add_to_cart || 0} /><Stat label="Cliques no WhatsApp" value={totals.whatsapp || 0} tone="green" /></div><div className="metrics-grid"><section className="panel chart"><h2>Visitas por dia</h2>{data.series?.length ? <Bars rows={data.series} valueKey="visits" secondKey="visitors" /> : <Empty>Ainda não há visitas neste período.</Empty>}<footer><span><i /> Visitas</span><span><i className="second" /> Visitantes</span></footer></section><section className="panel"><h2>Produtos mais vistos</h2>{data.top_products?.length ? data.top_products.map((row,index) => <div className="rank" key={row.product_slug}><b>{index + 1}</b><span>{row.product_slug}</span><strong>{row.views}</strong></div>) : <Empty>Sem visualizações de produto.</Empty>}</section></div><p className="privacy-note">Métricas anónimas: não guardamos nomes, e-mails, IP nem conteúdo das personalizações.</p></>}</>;
}

const emptyCustomsItem = { description: "", quantity: 1, weight: 0, value: 0, hsCode: "", origin: "PT" };
export function CustomsDeclaration({ user }) {
  const { data: declarationHistory, load: loadDeclarations } = useData("/customs-declarations");
  const [printing, setPrinting] = useState(false);
  const [form, setForm] = useState({ document: "CN22", destinationZone: "outside", nature: "SALE", senderName: "BeeCraft", senderVat: "", senderEori: "", senderAddress: "", senderPostal: "", senderCity: "Loulé", senderCountry: "PT", recipientName: "", recipientAddress: "", recipientPostal: "", recipientCity: "", recipientCountry: "", invoice: "", currency: "EUR", postage: 0, place: "Loulé", date: new Date().toISOString().slice(0,10), items: [{ ...emptyCustomsItem }] });
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const itemSet = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item,row) => row === index ? { ...item, [name]: value } : item) }));
  const total = form.items.reduce((sum,item) => sum + numberValue(item.value) * numberValue(item.quantity), 0);
  const weight = form.items.reduce((sum,item) => sum + numberValue(item.weight) * numberValue(item.quantity), 0);
  async function print() {
    setPrinting(true);
    try {
      const record = await api("/customs-declarations", { method: "POST", body: JSON.stringify({ document_type: form.document, recipient_name: form.recipientName || null, recipient_country: form.recipientCountry || null, total_value: total, payload: form }) });
      setForm((current) => ({ ...current, invoice: record.number }));
      await loadDeclarations();
      window.setTimeout(() => window.print(), 150);
    } finally { setPrinting(false); }
  }
  return <><PageHeader eyebrow="Envios internacionais" title="Declaração aduaneira" action={<button className="primary" onClick={print}>Imprimir / Guardar PDF</button>} /><div className={`customs-alert ${form.destinationZone === "eu" ? "ok" : ""}`}><strong>{form.destinationZone === "eu" ? "Envio dentro da União Europeia" : "Envio para fora do território aduaneiro da UE"}</strong><span>{form.destinationZone === "eu" ? "Em regra, mercadorias da União não exigem CN22/CN23. Existem exceções para territórios fiscais especiais e mercadorias sujeitas a controlo." : "Preencha os dados em inglês ou numa língua aceite no destino e confirme o formulário com os CTT ou a transportadora."}</span></div><div className="customs-layout"><section className="customs-form"><div className="panel form-grid"><Field label="Destino"><select value={form.destinationZone} onChange={(event) => set("destinationZone", event.target.value)}><option value="outside">Fora da UE / território especial</option><option value="eu">Dentro da UE</option></select></Field><Field label="Documento"><select value={form.document} onChange={(event) => set("document", event.target.value)}><option>CN22</option><option>CN23</option><option>Fatura comercial</option></select></Field><Field label="Natureza do envio"><select value={form.nature} onChange={(event) => set("nature", event.target.value)}><option value="SALE">Venda</option><option value="GIFT">Presente</option><option value="SAMPLE">Amostra comercial</option><option value="RETURN">Devolução</option><option value="DOCUMENTS">Documentos</option><option value="OTHER">Outro</option></select></Field><Field label="Nº fatura / encomenda"><input value={form.invoice} onChange={(event) => set("invoice", event.target.value)} /></Field></div><section className="panel"><h2>Remetente</h2><div className="form-grid">{[["senderName","Nome / empresa"],["senderVat","NIF / VAT"],["senderEori","EORI (se aplicável)"],["senderAddress","Morada"],["senderPostal","Código postal"],["senderCity","Localidade"],["senderCountry","País (ISO)"]].map(([key,label]) => <Field key={key} label={label}><input value={form[key]} onChange={(event) => set(key,event.target.value)} /></Field>)}</div></section><section className="panel"><h2>Destinatário</h2><div className="form-grid">{[["recipientName","Nome / empresa"],["recipientAddress","Morada"],["recipientPostal","Código postal"],["recipientCity","Localidade"],["recipientCountry","País (ISO)"]].map(([key,label]) => <Field key={key} label={label}><input value={form[key]} onChange={(event) => set(key,event.target.value)} /></Field>)}</div></section><section className="panel"><header className="section-heading"><h2>Conteúdo</h2><button onClick={() => setForm((current) => ({ ...current, items: [...current.items, { ...emptyCustomsItem }] }))}>+ Artigo</button></header>{form.items.map((item,index) => <div className="customs-item" key={index}><input placeholder="Descrição detalhada (preferencialmente em inglês)" value={item.description} onChange={(event) => itemSet(index,"description",event.target.value)} /><input type="number" min="1" placeholder="Qtd." value={item.quantity} onChange={(event) => itemSet(index,"quantity",event.target.value)} /><input type="number" min="0" step="0.001" placeholder="Peso kg" value={item.weight} onChange={(event) => itemSet(index,"weight",event.target.value)} /><input type="number" min="0" step="0.01" placeholder="Valor €" value={item.value} onChange={(event) => itemSet(index,"value",event.target.value)} /><input placeholder="Código HS" value={item.hsCode} onChange={(event) => itemSet(index,"hsCode",event.target.value)} /><input placeholder="Origem" value={item.origin} onChange={(event) => itemSet(index,"origin",event.target.value)} /><button aria-label="Remover" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_,row) => row !== index) }))}>×</button></div>)}<div className="form-grid">{[["postage","Portes (€)"],["place","Local"],["date","Data"]].map(([key,label]) => <Field key={key} label={label}><input type={key === "date" ? "date" : key === "postage" ? "number" : "text"} value={form[key]} onChange={(event) => set(key,event.target.value)} /></Field>)}</div></section></section><aside className="customs-preview"><div className="customs-paper"><small>PRÉ-VISUALIZAÇÃO</small><h2>DECLARAÇÃO ADUANEIRA · {form.document}</h2><div className="customs-parties"><div><b>REMETENTE</b><span>{form.senderName}</span><span>{form.senderAddress}</span><span>{form.senderPostal} {form.senderCity} · {form.senderCountry}</span><span>VAT {form.senderVat} {form.senderEori && `· EORI ${form.senderEori}`}</span></div><div><b>DESTINATÁRIO</b><span>{form.recipientName}</span><span>{form.recipientAddress}</span><span>{form.recipientPostal} {form.recipientCity} · {form.recipientCountry}</span></div></div><p><b>Natureza:</b> {form.nature} · <b>Referência:</b> {form.invoice || "—"}</p><table><thead><tr><th>Descrição</th><th>Qtd.</th><th>Peso</th><th>Valor</th><th>HS</th><th>Origem</th></tr></thead><tbody>{form.items.map((item,index) => <tr key={index}><td>{item.description || "—"}</td><td>{item.quantity}</td><td>{numberValue(item.weight).toFixed(3)} kg</td><td>{money(numberValue(item.value) * numberValue(item.quantity))}</td><td>{item.hsCode || "—"}</td><td>{item.origin}</td></tr>)}</tbody></table><div className="customs-totals"><span>Peso total: <b>{weight.toFixed(3)} kg</b></span><span>Valor total: <b>{money(total)}</b></span><span>Portes: <b>{money(form.postage)}</b></span></div><p className="customs-certification">Certifico que os dados desta declaração são corretos e que a remessa não contém artigos perigosos ou proibidos pela legislação postal ou aduaneira.</p><div className="customs-sign"><span>{form.place}, {date(form.date)}</span><span>Assinatura do remetente</span></div></div><p className="field-help">Documento de apoio. A submissão eletrónica e o impresso oficial devem ser confirmados com a transportadora.</p></aside></div></>;
}

export function Account({ user, onCredentialsChanged }) {
  const [form, setForm] = useState({
    email: user.email,
    currentPassword: "",
    newPassword: "",
    confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (form.newPassword && form.newPassword !== form.confirmation) {
      setError("A confirmação da nova senha não coincide.");
      return;
    }
    if (form.email === user.email && !form.newPassword) {
      setError("Altere o email ou informe uma nova senha.");
      return;
    }
    setSaving(true);
    try {
      await api("/auth/me/credentials", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: form.currentPassword,
          email: form.email === user.email ? null : form.email,
          new_password: form.newPassword || null,
        }),
      });
      setSuccess("Dados alterados. A terminar a sessão com segurança...");
      setTimeout(onCredentialsChanged, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Segurança" title="Minha conta" />
      <section className="panel account-panel">
        <div>
          <h2>Dados de acesso</h2>
          <p>
            Confirme a senha atual para trocar o email, a senha, ou ambos. Após
            guardar, será necessário entrar novamente.
          </p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Senha atual">
            <input
              type="password"
              autoComplete="current-password"
              minLength="8"
              required
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
            />
          </Field>
          <Field label="Nova senha (opcional)">
            <input
              type="password"
              autoComplete="new-password"
              minLength="10"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
            />
          </Field>
          <Field label="Confirmar nova senha">
            <input
              type="password"
              autoComplete="new-password"
              minLength="10"
              value={form.confirmation}
              onChange={(e) =>
                setForm({ ...form, confirmation: e.target.value })
              }
            />
          </Field>
          <ErrorMessage error={error} />
          {success && <p className="success">{success}</p>}
          <button className="primary wide" disabled={saving}>
            {saving ? "A guardar..." : "Guardar e terminar sessão"}
          </button>
        </form>
      </section>
    </>
  );
}

export function CustomsHistory() {
  const { data, error, loading, load } = useData("/customs-declarations");
  return (
    <>
      <PageHeader
        eyebrow="Auditoria"
        title="Histórico aduaneiro"
        action={<button onClick={load}>Atualizar</button>}
      />
      <p className="catalog-note">
        Cada impressão recebe uma referência única e fica associada ao utilizador autenticado.
      </p>
      <ErrorMessage error={error} />
      {loading ? <Empty>A carregar...</Empty> : data.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Documento</th><th>Destinatário</th><th>País</th><th>Valor</th><th>Impresso por</th><th>Data</th></tr></thead>
            <tbody>{data.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.number}</strong></td>
                <td>{row.document_type}</td>
                <td>{row.recipient_name || "—"}</td>
                <td>{row.recipient_country || "—"}</td>
                <td>{money(row.total_value)}</td>
                <td>{row.created_by?.name}<small>{row.created_by?.email}</small></td>
                <td>{new Date(row.printed_at).toLocaleString("pt-PT")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <Empty>Ainda não existem declarações impressas.</Empty>}
    </>
  );
}

export function CompanyUsers() {
  const { data, error, loading, load } = useData("/auth/users");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [formError, setFormError] = useState("");
  async function save(event) {
    event.preventDefault(); setFormError("");
    try {
      await api("/auth/users", { method: "POST", body: JSON.stringify(form) });
      setOpen(false); setForm({ name: "", email: "", password: "", role: "STAFF" }); load();
    } catch (requestError) { setFormError(requestError.message); }
  }
  return <><PageHeader eyebrow="Acesso protegido" title="Utilizadores da empresa" action={<button className="primary" onClick={() => setOpen(true)}>+ Novo utilizador</button>} /><p className="catalog-note">Crie uma conta individual para cada pessoa. O e-mail da conta ficará registado nas declarações impressas.</p><ErrorMessage error={error} />{loading ? <Empty>A carregar...</Empty> : <div className="cards">{data.map((row) => <article className="product-admin" key={row.id}><span>{row.role === "OWNER" ? "Proprietário" : "Colaborador"}</span><h3>{row.name}</h3><strong>{row.active ? "Ativo" : "Inativo"}</strong><small>{row.email}</small></article>)}</div>}{open && <Modal title="Novo utilizador da empresa" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={save}><Field label="Nome"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Email"><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Senha inicial"><input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field><Field label="Permissão"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="STAFF">Colaborador</option><option value="OWNER">Proprietário</option></select></Field><ErrorMessage error={formError} /><div className="modal-actions wide"><button type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary">Criar utilizador</button></div></form></Modal>}</>;
}

export function BusinessCosts() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const { data, error, loading, load } = useData(`/costs?month=${month}-01`);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const blank = { name: "", cost_type: "FIXED", category: "Renda e instalações", amount: "", reference_month: `${month}-01`, due_day: "", recurring: false, paid: false, notes: "" };
  const categories = ["Renda e instalações", "Energia e água", "Internet e telefone", "Software", "Contabilidade", "Seguros", "Marketing", "Transporte", "Matéria-prima", "Embalagens", "Comissões", "Manutenção", "Impostos e taxas", "Outros"];
  function open(row = blank) { setEditing({ ...row, due_day: row.due_day || "", reference_month: row.reference_month || `${month}-01`, created_by: undefined }); setFormError(""); }
  async function save(event) {
    event.preventDefault(); setFormError("");
    try {
      const payload = { ...editing, amount: Number(editing.amount), due_day: editing.due_day ? Number(editing.due_day) : null, reference_month: `${editing.reference_month.slice(0, 7)}-01`, created_by: undefined };
      await api(editing.id ? `/costs/${editing.id}` : "/costs", { method: editing.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setEditing(null); load();
    } catch (requestError) { setFormError(requestError.message); }
  }
  async function remove(row) { if (!confirm(`Eliminar o custo “${row.name}”?`)) return; await api(`/costs/${row.id}`, { method: "DELETE" }); load(); }
  const summary = data.summary || {};
  return <><PageHeader eyebrow="Controlo financeiro" title="Custos fixos e variáveis" action={<div className="actions"><input className="month-picker" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><button className="primary" onClick={() => open()}>+ Novo custo</button></div>} /><div className="stats"><Stat label="Custos fixos" value={money(summary.fixed)} /><Stat label="Custos variáveis" value={money(summary.variable)} /><Stat label="Total do mês" value={money(summary.total)} /><Stat label="Por pagar" value={money(summary.pending)} /></div><ErrorMessage error={error} />{loading ? <Empty>A carregar...</Empty> : data.items?.length ? <div className="table-wrap"><table><thead><tr><th>Custo</th><th>Tipo</th><th>Categoria</th><th>Vencimento</th><th>Estado</th><th>Valor</th><th></th></tr></thead><tbody>{data.items.map((row) => <tr key={row.id}><td><strong>{row.name}</strong>{row.recurring && <small>Recorrente mensal</small>}</td><td><span className={`tag ${row.cost_type === "FIXED" ? "fixed" : "variable"}`}>{row.cost_type === "FIXED" ? "Fixo" : "Variável"}</span></td><td>{row.category}</td><td>{row.due_day ? `Dia ${row.due_day}` : "—"}</td><td><span className={`tag ${row.paid ? "paid" : "pending"}`}>{row.paid ? "Pago" : "Pendente"}</span></td><td><strong>{money(row.amount)}</strong></td><td><div className="table-actions"><button onClick={() => open(row)}>Editar</button><button onClick={() => remove(row)}>Eliminar</button></div></td></tr>)}</tbody></table></div> : <Empty>Sem custos registados neste mês.</Empty>}{editing && <Modal title={editing.id ? "Editar custo" : "Novo custo"} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={save}><Field label="Descrição"><input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field><Field label="Tipo"><select value={editing.cost_type} onChange={(event) => setEditing({ ...editing, cost_type: event.target.value })}><option value="FIXED">Custo fixo</option><option value="VARIABLE">Custo variável</option></select></Field><Field label="Categoria"><select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Valor (€)"><input required type="number" min="0.01" step="0.01" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: event.target.value })} /></Field><Field label="Mês de referência"><input required type="month" value={editing.reference_month.slice(0, 7)} onChange={(event) => setEditing({ ...editing, reference_month: `${event.target.value}-01` })} /></Field><Field label="Dia de vencimento"><input type="number" min="1" max="31" value={editing.due_day} onChange={(event) => setEditing({ ...editing, due_day: event.target.value })} /></Field><Field label="Observações"><textarea rows="3" value={editing.notes || ""} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} /></Field><div className="cost-checks"><label><input type="checkbox" checked={editing.recurring} onChange={(event) => setEditing({ ...editing, recurring: event.target.checked })} /> Recorrente mensal</label><label><input type="checkbox" checked={editing.paid} onChange={(event) => setEditing({ ...editing, paid: event.target.checked })} /> Já está pago</label></div><ErrorMessage error={formError} /><div className="modal-actions wide"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="primary">Guardar custo</button></div></form></Modal>}</>;
}
