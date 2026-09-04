import { useCallback, useEffect, useState } from "react";
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
      <ErrorMessage error={error} />
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
      <ErrorMessage error={error} />
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
                    {item.sku} · {item.item_type}
                  </small>
                </div>
                <b>
                  {Number(item.stock_quantity)} {item.unit}
                </b>
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
      <ErrorMessage error={error} />
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
              <button onClick={() => simulate(p)}>Simular preço</button>
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

export function Sales() {
  const { data, error, loading, load } = useData("/sales");
  const { data: products } = useData("/products");
  const { data: customers } = useData("/customers");
  const [open, setOpen] = useState(false);
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
      <ErrorMessage error={error} />
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
                    <button onClick={() => receipt(row)}>PDF</button>
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

export function Purchases() {
  const { data, error, loading, load } = useData("/purchases");
  const { data: suppliers, load: loadSuppliers } = useData("/suppliers");
  const { data: inventory, load: loadStock } = useData("/inventory");
  const [open, setOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
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
      <ErrorMessage error={error} />
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
