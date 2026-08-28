import beeOnly from '../assets/bee-only.png';
import './BeeAnimation.css';

// Gera o caminho (path) de uma "onda" contínua, repetível horizontalmente,
// usada como superfície do mel dentro do hexágono.
function buildWavePath({ width, period, amplitude, baseline, bodyHeight }) {
  const half = period / 2;
  let d = `M -${period},${baseline + amplitude}`;
  let x = -period;
  let up = true;

  while (x < width + period) {
    const cx = x + half / 2;
    const cy = baseline + (up ? -amplitude : amplitude);
    const nx = x + half;
    const ny = baseline + (up ? amplitude : -amplitude);
    d += ` C ${cx},${cy} ${cx},${cy} ${nx},${ny}`;
    x = nx;
    up = !up;
  }

  d += ` L ${width + period},${baseline + bodyHeight}`;
  d += ` L -${period},${baseline + bodyHeight} Z`;
  return d;
}

// Gera o caminho de uma órbita elíptica fechada (a abelha percorre ela em loop)
function ellipseOrbit(cx, cy, rx, ry) {
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx - rx - 0.02},${cy + 0.02} Z`;
}

const HEX_POINTS = '150,27 250,84 250,196 150,253 50,196 50,84';
const HEX_POINTS_INNER = '150,34 243,88 243,192 150,246 57,192 57,88';

const wavePath = buildWavePath({
  width: 300,
  period: 100,
  amplitude: 7,
  baseline: 0,
  bodyHeight: 260,
});

// Centro aproximado do hexágono: (150, 140)
// Cada abelha tem sua própria órbita (algumas apertadas perto da colmeia,
// outras bem largas, saindo quase da área visível), tamanho e velocidade.
const BEES = [
  { id: 1, rx: 130, ry: 45, cx: 150, cy: 130, size: 26, dur: 5.2, begin: '0s' },
  { id: 2, rx: 50, ry: 150, cx: 150, cy: 140, size: 20, dur: 6.8, begin: '-1.4s' },
  { id: 3, rx: 190, ry: 90, cx: 150, cy: 150, size: 32, dur: 8.5, begin: '-3.1s' },
  { id: 4, rx: 95, ry: 95, cx: 150, cy: 140, size: 16, dur: 4.1, begin: '-0.6s' },
  { id: 5, rx: 220, ry: 60, cx: 150, cy: 120, size: 22, dur: 9.4, begin: '-5.7s' },
  { id: 6, rx: 70, ry: 190, cx: 150, cy: 145, size: 28, dur: 7.6, begin: '-2.9s' },
  { id: 7, rx: 150, ry: 130, cx: 150, cy: 140, size: 18, dur: 5.9, begin: '-4.3s' },
];

export default function BeeAnimation() {
  return (
    <div className="bee-anim">
      <svg viewBox="-70 -60 440 400" className="bee-anim-svg">
        <defs>
          <clipPath id="hexClip">
            <polygon points={HEX_POINTS_INNER} />
          </clipPath>

          {BEES.map((bee) => (
            <path
              key={bee.id}
              id={`orbit-${bee.id}`}
              d={ellipseOrbit(bee.cx, bee.cy, bee.rx, bee.ry)}
            />
          ))}
        </defs>

        {/* Mel subindo e ondulando dentro do hexágono */}
        <g clipPath="url(#hexClip)">
          <g className="honey-rise">
            <g className="honey-wave">
              <path d={wavePath} className="honey-fill" />
            </g>
          </g>
        </g>

        {/* Contorno da colmeia */}
        <polygon points={HEX_POINTS} className="bee-anim-hex" />

        {/* Abelhas: cada uma na sua órbita, tamanho e velocidade */}
        {BEES.map((bee) => (
          <image
            key={bee.id}
            href={beeOnly}
            className="bee-fly"
            x={-bee.size / 2}
            y={-bee.size / 2}
            width={bee.size}
            height={bee.size}
          >
            <animateMotion
              dur={`${bee.dur}s`}
              begin={bee.begin}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#orbit-${bee.id}`} />
            </animateMotion>
          </image>
        ))}
      </svg>
    </div>
  );
}
