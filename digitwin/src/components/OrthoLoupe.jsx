// src/components/OrthoLoupe.jsx
import React, { useEffect, useRef } from 'react';

const OrthoLoupe = ({ mousePos, img, view, zoomLevel = 4, size = 150 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !mousePos) return;

    const ctx = canvas.getContext('2d');

    // 1. Clear the loupe
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Calculate where we are on the ORIGINAL image
    // Invert the view transform: (Screen - Offset) / Scale
    const imgX = (mousePos.x - view.offsetX) / view.scale;
    const imgY = (mousePos.y - view.offsetY) / view.scale;

    // 3. Define the area we want to "snip" from the image
    // We want a small box around the cursor
    const sourceW = size / zoomLevel;
    const sourceH = size / zoomLevel;
    const sourceX = imgX - (sourceW / 2);
    const sourceY = imgY - (sourceH / 2);

    // 4. Draw that snippet into the loupe canvas, stretched to fill it
    ctx.save();

    // Circular Clipping (Makes it look like a lens)
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Background (in case we drag off the image)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    // Draw the zoomed image
    // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    try {
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceW, sourceH, // Source (Capture area)
        0, 0, size, size                    // Destination (Full loupe size)
      );
    } catch (e) {
      // Prevent crash if dragging way off screen
    }

    // Add Crosshair for precision
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)'; // Cyan
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Add Border (Rim of the glass)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

  }, [mousePos, img, view, zoomLevel, size]);

  // Positioning: The loupe follows the mouse, slightly offset so you can see
  const style = {
    position: 'absolute',
    left: mousePos.x + 20, // Offset 20px to right
    top: mousePos.y + 20,  // Offset 20px down
    width: size,
    height: size,
    borderRadius: '50%',
    pointerEvents: 'none', // Important! Let clicks pass through to the canvas below
    boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
    zIndex: 1000,
    background: '#000'
  };

  return <canvas ref={canvasRef} width={size} height={size} style={style} />;
};

export default OrthoLoupe;