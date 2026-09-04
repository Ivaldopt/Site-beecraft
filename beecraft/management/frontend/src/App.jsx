import { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./Login";
import {
  Customers,
  Dashboard,
  Products,
  Purchases,
  Reports,
  Sales,
  Account,
  Stock,
} from "./pages";

const modules = {
  dashboard: { label: "Dashboard", icon: "◈", component: Dashboard },
  sales: { label: "Vendas", icon: "↗", component: Sales },
  purchases: { label: "Compras", icon: "↙", component: Purchases },
  stock: { label: "Stock", icon: "▦", component: Stock },
  products: { label: "Produtos e preços", icon: "%", component: Products },
  customers: { label: "Clientes", icon: "♡", component: Customers },
  reports: { label: "Relatórios", icon: "≡", component: Reports },
  account: { label: "Minha conta", icon: "⚙", component: Account },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(location.hash.slice(1) || "dashboard");
  const [menu, setMenu] = useState(false);
  async function identify() {
    try {
      setUser(await api("/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    identify();
    const expired = () => setUser(null);
    window.addEventListener("auth-expired", expired);
    return () => window.removeEventListener("auth-expired", expired);
  }, []);
  function navigate(key) {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
    setMenu(false);
  }
  function logout() {
    localStorage.removeItem("beecraft-management-token");
    setUser(null);
  }
  if (loading)
    return (
      <div className="splash">
        Bee<span>Craft</span>
      </div>
    );
  if (!user) return <Login onLogin={identify} />;
  const Page = modules[active]?.component ?? Dashboard;
  return (
    <div className="shell">
      <aside className={menu ? "open" : ""}>
        <div className="logo">
          Bee<span>Craft</span>
          <small>GESTÃO</small>
        </div>
        <nav>
          {Object.entries(modules).map(([key, item]) => (
            <button
              className={active === key ? "active" : ""}
              key={key}
              onClick={() => navigate(key)}
            >
              <i>{item.icon}</i>
              {item.label}
            </button>
          ))}
        </nav>
        <footer>
          <div className="avatar">{user.name[0]}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button onClick={logout} aria-label="Sair">
            →
          </button>
        </footer>
      </aside>
      <main className="workspace">
        <header>
          <button
            className="menu-toggle"
            onClick={() => setMenu(!menu)}
            aria-label="Menu"
          >
            ☰
          </button>
          <span>{modules[active]?.label}</span>
          <div>
            <b>{user.name}</b>
            <small>
              {new Date().toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </small>
          </div>
        </header>
        <div className="content">
          <Page user={user} onCredentialsChanged={logout} />
        </div>
      </main>
      {menu && (
        <button
          className="scrim"
          onClick={() => setMenu(false)}
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
}
