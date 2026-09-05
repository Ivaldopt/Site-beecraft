import { useEffect, useRef } from 'react';
import agendaTemplate from '../assets/agenda-customization-template-v2.png';

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function fitImage(context, image, x, y, width, height, contain = false) {
  const scale = contain ? Math.min(width / image.width, height / image.height) : Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

export default function AgendaPreviewCanvas({ productName, customization, text, textColor = '#25211e', image, selections, details = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const width = 360;
    let cancelled = false;

    function draw(templateImage, uploadedImage) {
      if (cancelled) return;
      context.clearRect(0, 0, 360, 480);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, 360, 480);
      context.drawImage(templateImage, 0, 45, 360, 360);

      // A arte ocupa toda a capa; espiral, elástico e cantos são aplicados por cima.
      context.save();
      context.beginPath();
      context.rect(74, 72, 226, 302);
      context.clip();
      const coverChoice = selections.find((item) => item.optionSlug === 'cor-da-capa')?.value?.toLowerCase() ?? '';
      const coverColors = {
        branca: '#f4f1eb', preta: '#252525', rosa: '#dca2ad', azul: '#7aa3bd',
        verde: '#7f9b7b', lilas: '#a996bd', 'lilás': '#a996bd', bege: '#d8c3a5', vermelha: '#a84b47',
      };
      context.fillStyle = coverColors[coverChoice] ?? '#e8e8e8';
      context.fillRect(74, 72, 226, 302);

      if (uploadedImage) {
        if (customization === 'logo' || customization === 'logotipo') {
          context.fillStyle = coverColors[coverChoice] ?? '#e8e8e8';
          context.fillRect(74, 72, 226, 302);
          fitImage(context, uploadedImage, 105, 148, 164, 120, true);
        } else {
          fitImage(context, uploadedImage, 74, 72, 226, 302);
          context.fillStyle = 'rgba(20,18,16,.22)';
          context.fillRect(74, 296, 226, 78);
        }
      }

      context.textAlign = 'center';
      context.fillStyle = uploadedImage && !['logo', 'logotipo'].includes(customization) ? textColor : '#25211e';
      if (!uploadedImage) {
        context.font = '700 10px Inter, Arial, sans-serif';
        context.fillText('BEECRAFT', 187, 185);
      }
      if (text?.trim() || !uploadedImage) {
        context.font = '800 22px Inter, Arial, sans-serif';
        context.fillText(text?.trim() || 'A sua capa', 187, uploadedImage ? 338 : 231, 190);
      }
      if (!uploadedImage) {
        context.font = '500 8px Inter, Arial, sans-serif';
        context.fillText(productName, 187, 250, 190);
      }
      context.restore();

      // Reaplica os furos sobre a arte enviada para a espiral entrar na capa.
      for (let y = 86; y < 370; y += 9.75) {
        context.beginPath();
        context.arc(84, y, 2.5, 0, Math.PI * 2);
        context.fillStyle = '#888ca8';
        context.fill();
        context.beginPath();
        context.arc(83.4, y - .5, 1.25, 0, Math.PI * 2);
        context.fillStyle = '#d9dcec';
        context.fill();
      }

      const coilColors = { Dourada: '#d0a500', Prateada: '#aeb4b8', Branca: '#f7f4eb', Preta: '#403a35' };
      context.strokeStyle = coilColors[details.coilColor] ?? '#d0a500';
      context.lineWidth = 2.4;
      const binding = selections.find((item) => item.optionSlug === 'encadernacao')?.value?.toLowerCase() ?? '';
      if (binding.includes('wire')) {
        for (let y = 86; y < 370; y += 19.5) {
          for (const offset of [0, 7]) {
            context.beginPath();
            context.ellipse(70, y + offset, 14, 3.5, 0, 0, Math.PI * 2);
            context.stroke();
          }
        }
      } else {
        for (let y = 86; y < 370; y += 9.75) {
          context.beginPath();
          context.ellipse(70, y, 14, 4.2, 0, 0, Math.PI * 2);
          context.stroke();
        }
      }

      const selectedExtras = selections.filter((item) => item.optionSlug === 'extras').map((item) => `${item.value} ${item.name ?? ''}`.toLowerCase());
      const hasElastic = selectedExtras.some((value) => value.includes('elastico') || value.includes('elástico'));
      const hasCornerProtectors = selectedExtras.some((value) => value.includes('cantoneira'));

      const elasticColors = {
        'Dourado com brilho': '#b99736', 'Prateado com brilho': '#aeb4b8', Preto: '#24211f',
        Rosa: '#d98ca0', Azul: '#4b79a8', Verde: '#638b69', Vermelho: '#a84742',
        Roxo: '#765381', Castanho: '#754d38',
      };
      if (hasElastic || details.elasticColor) {
        context.fillStyle = elasticColors[details.elasticColor] ?? '#332f29';
        context.fillRect(261, 72, 10, 302);
        context.fillStyle = details.elasticColor ? 'rgba(255,255,255,.28)' : '#b99736';
        context.fillRect(263, 72, 2, 302);
      }

      if (hasCornerProtectors) {
        context.fillStyle = '#c3ad70';
        context.beginPath();
        context.moveTo(282, 72);
        context.lineTo(300, 72);
        context.lineTo(300, 90);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(282, 374);
        context.lineTo(300, 356);
        context.lineTo(300, 374);
        context.closePath();
        context.fill();
      }

      if (selectedExtras.some((value) => value.includes('marcador'))) {
        context.fillStyle = '#b56d55';
        context.beginPath();
        context.moveTo(221, 365);
        context.lineTo(231, 365);
        context.lineTo(231, 401);
        context.lineTo(226, 395);
        context.lineTo(221, 401);
        context.closePath();
        context.fill();
      }
      if (selectedExtras.some((value) => value.includes('caneta'))) {
        context.save();
        context.translate(302, 112);
        context.rotate(.07);
        context.fillStyle = '#c9a13d';
        roundedRect(context, 0, 0, 9, 230, 4);
        context.fill();
        context.fillStyle = '#fffdf8';
        context.fillRect(2, 24, 5, 170);
        context.restore();
      }

      context.fillStyle = '#665e57';
      context.textAlign = 'center';
      context.font = '600 10px Inter, Arial, sans-serif';
      const selectionLabel = selections.filter((item) => !['personalizacao', 'encadernacao'].includes(item.optionSlug)).map((item) => item.value).join('  •  ');
      context.fillText(selectionLabel, width / 2, 432, 320);
      const planning = [details.orientation, details.columns ? `${details.columns} coluna${details.columns === '1' ? '' : 's'}` : ''].filter(Boolean).join(' · ');
      context.font = '700 9px Inter, Arial, sans-serif';
      context.fillText(planning, width / 2, 451, 260);
    }

    const templateImage = new Image();
    templateImage.onload = () => {
      if (!image) return draw(templateImage, null);
      const uploadedImage = new Image();
      uploadedImage.onload = () => draw(templateImage, uploadedImage);
      uploadedImage.src = image;
    };
    templateImage.src = agendaTemplate;

    return () => { cancelled = true; };
  }, [productName, customization, text, textColor, image, selections, details]);

  return (
    <div className="agenda-live-preview">
      <div className="agenda-live-preview-head"><span>Pré-visualização em tempo real</span><b>Ao vivo</b></div>
      <canvas ref={canvasRef} width="360" height="480" aria-label="Pré-visualização da agenda personalizada" />
      <p>Imagem ilustrativa. O enquadramento final será confirmado antes da produção.</p>
    </div>
  );
}
