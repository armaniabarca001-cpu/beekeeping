import * as THREE from "three";

let woodTexture: THREE.CanvasTexture | null = null;
let honeycombTexture: THREE.CanvasTexture | null = null;

// Procedural textures instead of image assets - keeps the 3D scene fully
// self-contained (no network fetches, no binary files to ship) while still
// giving the boxes/frames a real material look instead of flat color fills.

export function getWoodTexture(): THREE.CanvasTexture {
  if (woodTexture) return woodTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#dcb877";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 50; i++) {
    const y = (i / 50) * 256 + (Math.sin(i * 12.9) * 0.5 + 0.5) * 6;
    const shade = Math.sin(i * 37.1) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(120, 80, 40, ${0.06 + shade * 0.14})`;
    ctx.lineWidth = 1 + shade * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 5);
    }
    ctx.stroke();
  }

  // occasional knots
  for (let i = 0; i < 3; i++) {
    const kx = 30 + ((i * 91) % 200);
    const ky = 30 + ((i * 137) % 200);
    const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, 10);
    grad.addColorStop(0, "rgba(90, 55, 25, 0.55)");
    grad.addColorStop(1, "rgba(90, 55, 25, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(kx, ky, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  woodTexture = new THREE.CanvasTexture(canvas);
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1.5, 1.5);
  return woodTexture;
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

export function getHoneycombTexture(): THREE.CanvasTexture {
  if (honeycombTexture) return honeycombTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#f3d878");
  grad.addColorStop(1, "#e8c563");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const hexSize = 11;
  const hexWidth = hexSize * Math.sqrt(3);
  ctx.strokeStyle = "rgba(160, 110, 30, 0.55)";
  ctx.lineWidth = 1;
  for (let row = -1; row < 256 / (hexSize * 1.5) + 1; row++) {
    for (let col = -1; col < 256 / hexWidth + 1; col++) {
      const x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0);
      const y = row * hexSize * 1.5;
      drawHexagon(ctx, x, y, hexSize);
    }
  }

  honeycombTexture = new THREE.CanvasTexture(canvas);
  honeycombTexture.wrapS = honeycombTexture.wrapT = THREE.RepeatWrapping;
  return honeycombTexture;
}
