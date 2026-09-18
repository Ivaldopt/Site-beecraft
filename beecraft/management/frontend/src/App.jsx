import { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./Login";
import { Account, BusinessCosts, CatalogMetrics, CompanyUsers, Customers, CustomsDeclaration, CustomsHistory, Dashboard, PricingCalculator, Products, ProductionBoard, Purchases, Reports, Sales, Stock, StoreCatalog, StoreCategories } from "./pages";

const modules = {
  dashboard: { label: "Dashboard", icon: "⌂", component: Dashboard },
  sales: { label: "Vendas e pedidos", icon: "↗", component: Sales, group: "Operação" },
  production: { label: "Produção do dia", icon: "▤", component: ProductionBoard, group: "Operação" },
  purchases: { label: "Compras", icon: "↙", component: Purchases, group: "Operação" },
  costs: { label: "Custos fixos e variáveis", icon: "€", component: BusinessCosts, group: "Operação" },
  stock: { label: "Stock", icon: "◇", component: Stock, group: "Operação" },
  products: { label: "Produtos e preços", icon: "%", component: Products, group: "Operação" },
  pricing: { label: "Calculadora de preços", icon: "€", component: PricingCalculator, group: "Operação" },
  customs: { label: "Declaração aduaneira", icon: "▧", component: CustomsDeclaration, group: "Operação" },
  customsHistory: { label: "Histórico aduaneiro", icon: "☷", component: CustomsHistory, group: "Operação" },
  customers: { label: "Clientes", icon: "♡", component: Customers, group: "Operação" },
  store: { label: "Produtos da loja", icon: "▣", component: StoreCatalog, group: "Catálogo" },
  categories: { label: "Categorias", icon: "⊞", component: StoreCategories, group: "Catálogo" },
  reports: { label: "Relatórios e métricas", icon: "≡", component: Reports, group: "Análise" },
  metrics: { label: "Métricas do catálogo", icon: "⌁", component: CatalogMetrics, group: "Análise" },
  account: { label: "Configurações", icon: "⚙", component: Account, group: "Conta" },
  users: { label: "Utilizadores", icon: "♙", component: CompanyUsers, group: "Conta", ownerOnly: true },
};

const groups = ["Operação", "Catálogo", "Análise", "Conta"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(location.hash.slice(1) || "dashboard");
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("beecraft-sidebar-collapsed") === "true");
  const [dark, setDark] = useState(() => localStorage.getItem("beecraft-management-theme") === "dark");
  async function identify() { try { setUser(await api("/auth/me")); } catch { setUser(null); } finally { setLoading(false); } }
  useEffect(() => { identify(); const expired = () => setUser(null); window.addEventListener("auth-expired", expired); return () => window.removeEventListener("auth-expired", expired); }, []);
  useEffect(() => { document.documentElement.classList.toggle("admin-dark", dark); localStorage.setItem("beecraft-management-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { localStorage.setItem("beecraft-sidebar-collapsed", collapsed); }, [collapsed]);
  function navigate(key) { setActive(key); window.history.replaceState(null, "", `#${key}`); window.scrollTo({ top: 0, behavior: "auto" }); setMenu(false); }
  function logout() { localStorage.removeItem("beecraft-management-token"); setUser(null); }
  if (loading) return <div className="splash">Bee<span>Craft</span></div>;
  if (!user) return <Login onLogin={identify} />;
  const Page = modules[active]?.component ?? Dashboard;
  return <div className="shell">
    <aside className={`${menu ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="admin-brand"><div className="brand-mark">B</div><div className="logo">Bee<span>Craft</span><small>PAINEL DE GESTÃO</small></div><button className="collapse-toggle" onClick={() => setCollapsed((value) => !value)} title={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? "›" : "‹"}</button></div>
      <nav className="admin-nav">
        <button title={modules.dashboard.label} className={active === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><i>{modules.dashboard.icon}</i><em>{modules.dashboard.label}</em></button>
        {groups.map((group) => <div className="nav-group" key={group}><span>{group}</span>{Object.entries(modules).filter(([, item]) => item.group === group && (!item.ownerOnly || user.role === "OWNER")).map(([key, item]) => <button title={item.label} className={active === key ? "active" : ""} key={key} onClick={() => navigate(key)}><i>{item.icon}</i><em>{item.label}</em></button>)}</div>)}
      </nav>
      <footer><div className="avatar">{user.name[0]}</div><div><strong>{user.name}</strong><small>{user.role}</small></div><button onClick={logout} aria-label="Sair">→</button></footer>
    </aside>
    <main className="workspace"><header><button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button><div className="header-title"><small>BeeCraft / {modules[active]?.group || "Visão geral"}</small><span>{modules[active]?.label}</span></div><div className="header-tools"><a href={import.meta.env.VITE_STORE_URL || "/"} target="_blank" rel="noreferrer">Ver loja ↗</a><button onClick={() => setDark((value) => !value)} aria-label="Mudar tema">{dark ? "☀" : "◐"}</button><div><b>{user.name}</b><small>{new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}</small></div></div></header><div className="content"><Page user={user} onCredentialsChanged={logout} /></div></main>
    {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Fechar menu" />}
  </div>;
}
