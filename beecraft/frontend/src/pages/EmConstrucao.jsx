import BeeAnimation from '../components/BeeAnimation';
import './EmConstrucao.css';

export default function EmConstrucao() {
  return (
    <div className="em-construcao">
      <BeeAnimation />

      <div className="logo em-construcao-logo">
        Bee<span>craft</span>
      </div>

      <div className="eyebrow em-construcao-eyebrow">
        Estamos a preparar algo especial
      </div>

      <h1 className="em-construcao-title">Papelaria feita para ser só sua.</h1>

      <p className="lead em-construcao-lead">
        A nossa loja de agendas, planners e cadernos personalizados está quase pronta.
        Volte em breve.
      </p>
    </div>
  );
}
