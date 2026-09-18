import { useEffect, useRef } from 'react';

function roundedPage(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export default function NotebookInteriorCanvas({ interior = '', format = 'A5' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const style = interior.toLowerCase();
    context.clearRect(0, 0, 720, 960);

    const background = context.createLinearGradient(0, 0, 720, 960);
    background.addColorStop(0, '#eee5d8');
    background.addColorStop(1, '#d8c9b6');
    context.fillStyle = background;
    context.fillRect(0, 0, 720, 960);

    context.save();
    context.translate(0, 240);

    context.save();
    context.shadowColor = 'rgba(45,35,25,.22)';
    context.shadowBlur = 30;
    context.shadowOffsetY = 15;
    roundedPage(context, 58, 48, 604, 370, 16);
    context.fillStyle = '#d8d0c4';
    context.fill();
    context.restore();

    const pages = [{ x: 68, width: 282 }, { x: 370, width: 282 }];
    pages.forEach(({ x, width }, pageIndex) => {
      context.save();
      context.shadowColor = 'rgba(52,43,34,.13)';
      context.shadowBlur = 9;
      roundedPage(context, x, 58, width, 348, pageIndex ? 14 : 14);
      const paper = context.createLinearGradient(x, 0, x + width, 0);
      paper.addColorStop(0, pageIndex ? '#f9f6ef' : '#fffdf8');
      paper.addColorStop(1, pageIndex ? '#fffdf8' : '#f5f0e7');
      context.fillStyle = paper;
      context.fill();
      context.clip();

      context.strokeStyle = '#d9cfc0';
      context.fillStyle = '#c9beae';
      context.lineWidth = 1;
      if (style.includes('quadric')) {
        for (let px = x + 18; px < x + width; px += 18) {
          context.beginPath(); context.moveTo(px, 74); context.lineTo(px, 390); context.stroke();
        }
        for (let py = 76; py < 398; py += 18) {
          context.beginPath(); context.moveTo(x + 12, py); context.lineTo(x + width - 12, py); context.stroke();
        }
      } else if (style.includes('pontilh')) {
        for (let py = 79; py < 394; py += 18) {
          for (let px = x + 18; px < x + width - 8; px += 18) {
            context.beginPath(); context.arc(px, py, 1.25, 0, Math.PI * 2); context.fill();
          }
        }
      } else {
        for (let py = 86; py < 394; py += 22) {
          context.beginPath(); context.moveTo(x + 18, py); context.lineTo(x + width - 16, py); context.stroke();
        }
        context.strokeStyle = '#ddb4aa';
        context.beginPath(); context.moveTo(x + 35, 70); context.lineTo(x + 35, 395); context.stroke();
      }
      context.restore();
    });

    context.strokeStyle = '#b78b36';
    context.lineWidth = 4;
    for (let y = 75; y < 395; y += 22) {
      context.beginPath();
      context.ellipse(360, y, 15, 6, 0, 0, Math.PI * 2);
      context.stroke();
    }

    context.fillStyle = '#6b6258';
    context.textAlign = 'center';
    context.font = '700 15px Inter, Arial, sans-serif';
    const label = style.includes('quadric') ? 'Interior quadriculado' : style.includes('pontilh') ? 'Interior pontilhado' : style.includes('paut') ? 'Interior pautado' : 'Escolha o tipo de interior';
    context.fillText(`${label} · ${format}`, 360, 452);
    context.restore();
  }, [interior, format]);

  return <div className="agenda-live-preview notebook-interior-preview"><div className="agenda-live-preview-head"><span>Interior do caderno</span><b>Ao vivo</b></div><canvas ref={canvasRef} width="720" height="960" aria-label={`Caderno aberto com ${interior || 'interior por escolher'}`} /><p>Pré-visualização ilustrativa do interior selecionado.</p></div>;
}
