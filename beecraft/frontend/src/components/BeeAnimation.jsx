import beeLogo from '../assets/bee-logo.png';
import './BeeAnimation.css';

export default function BeeAnimation() {
  return (
    <div className="bee-anim">
      <svg viewBox="0 0 240 240" className="bee-anim-svg">
        {/* Hexágono sendo "construído" */}
        <polygon
          className="bee-anim-hex"
          points="120,20 200,65 200,155 120,200 40,155 40,65"
        />

        {/* Caminho invisível que a abelha percorre */}
        <path
          id="bee-orbit-path"
          className="bee-anim-path"
          d="M 208,110 A 88,88 0 1 1 207.9,109 Z"
        />

        {/* A imagem real da abelha, voando ao longo do caminho */}
        <image
          href={beeLogo}
          className="bee-anim-flutter"
          x="-16"
          y="-16"
          width="32"
          height="32"
        >
          <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto">
            <mpath href="#bee-orbit-path" />
          </animateMotion>
        </image>
      </svg>
    </div>
  );
}
