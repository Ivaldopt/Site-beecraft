import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="container not-found-page">
      <span>404</span>
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou já não estar disponível.</p>
      <Link className="btn primary" to="/">Voltar ao início</Link>
    </main>
  );
}
