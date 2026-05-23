export async function generateStoryCard(imageUrl: string, text: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Dimensions for 9:16 story (1080x1920)
  canvas.width = 1080;
  canvas.height = 1920;

  // 1. Draw Premium Background Gradient
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.height
  );
  gradient.addColorStop(0, '#1e1b4b'); // Deep indigo
  gradient.addColorStop(1, '#09090b'); // Near black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add some accent glows
  ctx.globalCompositeOperation = 'screen';
  const purpleGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1000);
  purpleGlow.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
  purpleGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pinkGlow = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, 1000);
  pinkGlow.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
  pinkGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = pinkGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.globalCompositeOperation = 'source-over';

  // 2. Load and Draw User Image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  // Calculate dimensions to fit image (cover style)
  const padding = 80;
  const cardWidth = canvas.width - (padding * 2);
  const cardHeight = cardWidth; // Square for the photo
  const cardY = 400;

  // Draw a subtle shadow/glow for the photo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Clip for rounded corners on the image
  const radius = 40;
  ctx.beginPath();
  ctx.moveTo(padding + radius, cardY);
  ctx.lineTo(padding + cardWidth - radius, cardY);
  ctx.quadraticCurveTo(padding + cardWidth, cardY, padding + cardWidth, cardY + radius);
  ctx.lineTo(padding + cardWidth, cardY + cardHeight - radius);
  ctx.quadraticCurveTo(padding + cardWidth, cardY + cardHeight, padding + cardWidth - radius, cardY + cardHeight);
  ctx.lineTo(padding + radius, cardY + cardHeight);
  ctx.quadraticCurveTo(padding, cardY + cardHeight, padding, cardY + cardHeight - radius);
  ctx.lineTo(padding, cardY + radius);
  ctx.quadraticCurveTo(padding, cardY, padding + radius, cardY);
  ctx.closePath();
  ctx.save();
  ctx.clip();

  // Draw image (center crop)
  const imgRatio = img.width / img.height;
  let drawW, drawH, drawX, drawY;
  if (imgRatio > 1) {
    drawH = cardHeight;
    drawW = cardHeight * imgRatio;
    drawX = padding - (drawW - cardWidth) / 2;
    drawY = cardY;
  } else {
    drawW = cardWidth;
    drawH = cardWidth / imgRatio;
    drawX = padding;
    drawY = cardY - (drawH - cardHeight) / 2;
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
  
  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. Draw Branding
  ctx.fillStyle = '#fafafa';
  ctx.textAlign = 'center';
  
  // Title
  ctx.font = 'bold 80px Inter, sans-serif';
  ctx.fillText('GRADUATION 2026', canvas.width / 2, 280);
  
  // Subtitle
  ctx.font = '40px Inter, sans-serif';
  ctx.fillStyle = 'rgba(250, 250, 250, 0.6)';
  ctx.fillText('TIME MACHINE MOMENT', canvas.width / 2, 340);

  // 4. Draw Journal Text
  ctx.fillStyle = '#fafafa';
  ctx.font = 'italic 48px Inter, sans-serif';
  
  // Simple word wrap for journal text
  const maxWidth = canvas.width - (padding * 3);
  const words = text.split(' ');
  let line = '';
  let y = cardY + cardHeight + 120;
  const lineHeight = 70;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);

  // 5. Footer Branding
  const footerY = canvas.height - 150;
  ctx.font = '32px Inter, sans-serif';
  ctx.fillStyle = 'rgba(250, 250, 250, 0.4)';
  ctx.fillText('Captured for your future self', canvas.width / 2, footerY);
  
  // Progress bar style line (Spotify-esque)
  ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
  ctx.fillRect(padding, footerY + 40, canvas.width - (padding * 2), 6);
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(padding, footerY + 40, (canvas.width - (padding * 2)) * 0.7, 6);

  return canvas.toDataURL('image/png');
}
