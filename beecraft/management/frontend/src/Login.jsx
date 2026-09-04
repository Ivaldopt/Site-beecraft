import { useState } from "react";
import { api } from "./api";
import { ErrorMessage, Field } from "./components";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: new URLSearchParams({
          username: form.email,
          password: form.password,
        }),
      });
      localStorage.setItem("beecraft-management-token", data.access_token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login">
      <section className="login-card">
        <div className="brand-mark">B</div>
        <p className="eyebrow">BeeCraft</p>
        <h1>Bem-vinda de volta</h1>
        <p>Entre para gerir a sua papelaria.</p>
        <form onSubmit={submit}>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </Field>
          <Field label="Palavra-passe">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength="8"
              required
            />
          </Field>
          <ErrorMessage error={error} />
          <button className="primary wide" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
