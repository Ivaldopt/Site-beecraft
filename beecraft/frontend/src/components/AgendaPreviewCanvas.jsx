import { useEffect, useRef } from 'react';

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function fitImage(context, image, x, y, width, height, contain = false) {
  const scale = contain
    ? Math.min(width / image.width, height / image.height)
    : Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

export default function AgendaPreviewCanvas({ productName, customization, text, image, selections }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const width = 360;
    const height = 480;
    let cancelled = false;

    function draw(uploadedImage) {
      if (cancelled) return;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(35, 25, 325, 455);
      gradient.addColorStop(0, '#c79b54');
      gradient.addColorStop(1, '#8f513f');
      context.fillStyle = '#eee6dc';
      context.fillRect(0, 0, width, height);

      context.save();
      context.shadowColor = 'rgba(36,32,29,.28)';
      context.shadowBlur = 25;
      context.shadowOffsetY = 14;
      roundedRect(context, 50, 30, 265, 410, 19);
      context.fillStyle = gradient;
      context.fill();
      context.restore();

      context.save();
      roundedRect(context, 50, 30, 265, 410, 19);
      context.clip();

      context.strokeStyle = 'rgba(255,255,255,.22)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(290, 72, 92, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(74, 414, 72, 0, Math.PI * 2);
      context.stroke();

      if (uploadedImage) {
        if (customization === 'logo' || customization === 'logotipo') {
          context.fillStyle = 'rgba(255,255,255,.9)';
          roundedRect(context, 100, 125, 165, 150, 15);
          context.fill();
          fitImage(context, uploadedImage, 118, 143, 129, 114, true);
        } else {
          roundedRect(context, 82, 92, 201, 235, 15);
          context.clip();
          fitImage(context, uploadedImage, 82, 92, 201, 235);
        }
      } else {
        context.textAlign = 'center';
        context.fillStyle = '#fff9ef';
        context.font = '700 13px Inter, Arial, sans-serif';
        context.fillText('BEECRAFT', 182, 157);
        context.font = '800 28px Inter, Arial, sans-serif';
        context.fillText(text?.trim() || 'A sua agenda', 182, 220, 205);
        context.font = '500 11px Inter, Arial, sans-serif';
        context.fillText(productName, 182, 246, 205);
      }

      context.restore();

      const binding = selections.find((item) => item.optionSlug === 'encadernacao')?.value ?? '';
      context.strokeStyle = '#403a35';
      context.lineWidth = 3;
      if (binding.toLowerCase().includes('espiral')) {
        for (let y = 55; y < 420; y += 18) {
          context.beginPath();
          context.arc(49, y, 8, -.8, .8);
          context.stroke();
        }
      } else {
        for (let y = 55; y < 420; y += 25) {
          roundedRect(context, 42, y, 16, 7, 3);
          context.stroke();
        }
      }

      context.fillStyle = '#665e57';
      context.textAlign = 'center';
      context.font = '600 11px Inter, Arial, sans-serif';
      const details = selections
        .filter((item) => !['personalizacao', 'encadernacao'].includes(item.optionSlug))
        .map((item) => item.value)
        .join('  •  ');
      context.fillText(details, width / 2, 464, 310);
    }

    if (image) {
      const uploadedImage = new Image();
      uploadedImage.onload = () => draw(uploadedImage);
      uploadedImage.src = image;
    } else {
      draw(null);
    }

    return () => { cancelled = true; };
  }, [productName, customization, text, image, selections]);

  return (
    <div className="agenda-live-preview">
      <div className="agenda-live-preview-head">
        <span>Pré-visualização em tempo real</span>
        <b>Ao vivo</b>
      </div>
      <canvas
        ref={canvasRef}
        width="360"
        height="480"
        aria-label="Pré-visualização da agenda personalizada"
      />
      <p>Imagem ilustrativa. O enquadramento final será confirmado antes da produção.</p>
    </div>
  );
}
