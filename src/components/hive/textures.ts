import * as THREE from "three";

let woodTexture: THREE.CanvasTexture | null = null;
let honeycombTexture: THREE.CanvasTexture | null = null;
let corrugatedMetalTexture: THREE.CanvasTexture | null = null;
const paintedTextureCache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function shade([r, g, b]: [number, number, number], amount: number): string {
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

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

interface PaintedTextureOptions {
  withHandle?: boolean;
  withJoints?: boolean;
}

// A satin-painted finish (like the reference hive photo) - solid color with
// faint grain showing through, an optional routed hand-hold, and optional
// box-joint "fingers" along the vertical edges.
export function getPaintedTexture(
  colorHex: string,
  { withHandle, withJoints }: PaintedTextureOptions = {},
): THREE.CanvasTexture {
  const cacheKey = `${colorHex}:${withHandle ? 1 : 0}:${withJoints ? 1 : 0}`;
  const cached = paintedTextureCache.get(cacheKey);
  if (cached) return cached;

  const rgb = hexToRgb(colorHex);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  // faint grain showing through the paint
  for (let i = 0; i < 30; i++) {
    const y = (i / 30) * 256;
    ctx.strokeStyle = shade(rgb, (Math.sin(i * 12.9) > 0 ? 1 : -1) * (6 + Math.random() * 6));
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // subtle vertical vignette for a satin, non-flat look
  const vgrad = ctx.createLinearGradient(0, 0, 0, 256);
  vgrad.addColorStop(0, "rgba(255,255,255,0.08)");
  vgrad.addColorStop(0.5, "rgba(0,0,0,0)");
  vgrad.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.fillStyle = vgrad;
  ctx.fillRect(0, 0, 256, 256);

  if (withJoints) {
    const toothH = 256 / 10;
    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? 0 : 256 - 10;
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) continue;
        ctx.fillStyle = shade(rgb, -18);
        ctx.fillRect(x, i * toothH, 10, toothH);
        ctx.strokeStyle = shade(rgb, -32);
        ctx.lineWidth = 1;
        ctx.strokeRect(x, i * toothH, 10, toothH);
      }
    }
  }

  if (withHandle) {
    const hx = 128;
    const hy = 92;
    const hw = 64;
    const hh = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hx - hw / 2 + hh / 2, hy - hh / 2);
    ctx.arcTo(hx + hw / 2, hy - hh / 2, hx + hw / 2, hy + hh / 2, hh / 2);
    ctx.arcTo(hx + hw / 2, hy + hh / 2, hx - hw / 2, hy + hh / 2, hh / 2);
    ctx.arcTo(hx - hw / 2, hy + hh / 2, hx - hw / 2, hy - hh / 2, hh / 2);
    ctx.arcTo(hx - hw / 2, hy - hh / 2, hx + hw / 2, hy - hh / 2, hh / 2);
    ctx.closePath();
    const hgrad = ctx.createLinearGradient(0, hy - hh / 2, 0, hy + hh / 2);
    hgrad.addColorStop(0, shade(rgb, -55));
    hgrad.addColorStop(0.5, shade(rgb, -70));
    hgrad.addColorStop(1, shade(rgb, -30));
    ctx.fillStyle = hgrad;
    ctx.fill();
    ctx.strokeStyle = shade(rgb, -85);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  paintedTextureCache.set(cacheKey, texture);
  return texture;
}

export function getCorrugatedMetalTexture(): THREE.CanvasTexture {
  if (corrugatedMetalTexture) return corrugatedMetalTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#c7ccd1";
  ctx.fillRect(0, 0, 128, 128);

  const stripe = 8;
  for (let x = 0; x < 128; x += stripe) {
    const grad = ctx.createLinearGradient(x, 0, x + stripe, 0);
    grad.addColorStop(0, "rgba(255,255,255,0.5)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.08)");
    grad.addColorStop(0.55, "rgba(30,35,40,0.15)");
    grad.addColorStop(1, "rgba(30,35,40,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, stripe, 128);
  }

  corrugatedMetalTexture = new THREE.CanvasTexture(canvas);
  corrugatedMetalTexture.wrapS = corrugatedMetalTexture.wrapT = THREE.RepeatWrapping;
  corrugatedMetalTexture.repeat.set(3, 1.5);
  return corrugatedMetalTexture;
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
