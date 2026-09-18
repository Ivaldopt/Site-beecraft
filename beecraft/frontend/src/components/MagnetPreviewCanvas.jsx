import { useEffect, useRef } from 'react';
import magnetTemplate from '../assets/magnet-button-template.png';

function fitImage(context, image, x, y, width, height, contain = false) {
  const scale = contain ? Math.min(width / image.width, height / image.height) : Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

export default function MagnetPreviewCanvas({ customization, text, textColor, image, selections }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let cancelled = false;
    const coverChoice = selections.find((item) => item.optionSlug === 'cor-da-capa')?.value?.toLowerCase() ?? '';
    const shape = selections.find((item) => item.optionSlug === 'formato-iman')?.value?.toLowerCase() ?? 'quadrado';
    const colors = { branca: '#fffaf0', preta: '#252525', rosa: '#dca2ad', azul: '#7aa3bd', verde: '#7f9b7b', lilas: '#a996bd', bege: '#d8c3a5', vermelha: '#a84b47' };

    function draw(template, uploadedImage) {
      if (cancelled) return;
      context.clearRect(0, 0, 480, 480);
      context.drawImage(template, 0, 0, 480, 480);
      context.save();
      context.beginPath();
      if (shape.includes('redondo')) context.arc(183, 292, 108, 0, Math.PI * 2);
      else context.roundRect(66, 182, 234, 220, 25);
      context.clip();
      context.fillStyle = colors[coverChoice] ?? '#fffaf0';
      context.fillRect(60, 175, 248, 235);

      if (uploadedImage) {
        if (['logo', 'logotipo'].includes(customization)) {
          fitImage(context, uploadedImage, 95, 220, 176, 140, true);
        } else {
          fitImage(context, uploadedImage, 66, 182, 234, 220);
          context.fillStyle = 'rgba(20,18,16,.2)';
          context.fillRect(66, 330, 234, 72);
        }
      }

      context.fillStyle = uploadedImage && !['logo', 'logotipo'].includes(customization) ? textColor : '#25211e';
      context.textAlign = 'center';
      if (!uploadedImage) {
        context.font = '800 14px Inter, Arial, sans-serif';
        context.fillText('BEECRAFT', 183, 267);
      }
      if (text?.trim()) {
        context.font = '800 24px Inter, Arial, sans-serif';
        context.fillText(text.trim(), 183, uploadedImage ? 368 : 312, 190);
      }
      context.restore();
    }

    const template = new Image();
    template.onload = () => {
      if (!image) return draw(template, null);
      const uploadedImage = new Image();
      uploadedImage.onload = () => draw(template, uploadedImage);
      uploadedImage.src = image;
    };
    template.src = magnetTemplate;
    return () => { cancelled = true; };
  }, [customization, text, textColor, image, selections]);

  return <div className="agenda-live-preview magnet-live-preview"><div className="agenda-live-preview-head"><span>Pré-visualização do íman</span><b>Ao vivo</b></div><canvas ref={canvasRef} width="480" height="480" aria-label="Pré-visualização do íman personalizado" /><p>Imagem ilustrativa. Confirme o enquadramento antes da produção.</p></div>;
}
