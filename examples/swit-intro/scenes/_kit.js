// Swit intro look: cinematic dark, blue and violet light, glass panels, blur-in type, wipe transitions.
// Everything is a pure function of time so any frame renders on its own.
export const C = { bg: '#0a0c11', p: '#12151c', r: '#1b2029', l: '#2a303c', t: '#eef1f7', s: '#9aa4b6', c: '#8fb4ff', c2: '#a98bff', ci: '#0b1020', ok: '#6fe3a0' };
export const SANS = '"IBM Plex Sans", Inter, sans-serif';
export const MONO = '"IBM Plex Mono", monospace';

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, k) => a + (b - a) * k;
export const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const eo5 = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const spring = (x, k = 1) => { x = clamp(x); return 1 - Math.exp(-7 * x) * Math.cos(11 * k * x); }; // overshoot then settle
export const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

/* ---------- background: moving light, particles, grid, vignette, grain ---------- */
const P = (() => { const r = rng(7); return Array.from({ length: 70 }, () => ({ x: r(), y: r(), z: 0.3 + r() * 0.7, ph: r() * 6.28, sp: 0.01 + r() * 0.03 })); })();
let grain = null;
function grainTile() {
  if (grain) return grain;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), img = g.createImageData(256, 256), r = rng(99);
  for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); grain = c; return c;
}

export function background(ctx, w, h, gt, { glow = 1, hue = 0 } = {}) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const blobs = [
    { x: 0.2 + 0.12 * Math.sin(gt * 0.35), y: 0.25 + 0.1 * Math.cos(gt * 0.3), r: 0.62, c: [70, 110, 255], a: 0.2 },
    { x: 0.82 + 0.1 * Math.cos(gt * 0.28), y: 0.75 + 0.12 * Math.sin(gt * 0.33), r: 0.7, c: [140, 90, 255], a: 0.17 },
    { x: 0.55 + 0.15 * Math.sin(gt * 0.22 + 2), y: 0.5 + 0.1 * Math.cos(gt * 0.4), r: 0.45, c: [40, 190, 220], a: 0.07 },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * w);
    g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a * glow})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  // fine grid fading toward the edges
  ctx.save(); ctx.strokeStyle = 'rgba(160,185,255,0.045)'; ctx.lineWidth = 1;
  const off = (gt * 12) % 80;
  for (let x = -80 + off; x < w + 80; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
  ctx.restore();
  // particles
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of P) {
    const x = ((p.x + gt * p.sp * p.z + 1) % 1) * w, y = (p.y + 0.03 * Math.sin(gt * 0.6 + p.ph)) * h;
    const a = (0.25 + 0.25 * Math.sin(gt * 1.3 + p.ph)) * p.z;
    ctx.fillStyle = `rgba(170,200,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 1.2 + 2.2 * p.z, 0, 7); ctx.fill();
  }
  ctx.restore();
  // vignette
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}

// Film grain: a fixed noise tile shifted every frame step. Call last, before the HUD.
export function finish(ctx, w, h, gt) {
  const g = grainTile(), step = Math.floor(gt * 24), r = rng(step * 31 + 5);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256);
  for (let x = ox; x < w; x += 256) for (let y = oy; y < h; y += 256) ctx.drawImage(g, x, y);
  ctx.restore();
}

// Timecode and brand corners.
export function hud(ctx, w, h, gt, total, text) {
  const f = Math.floor(gt * 30) % 30, s = Math.floor(gt) % 60, m = Math.floor(gt / 60);
  const tc = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  ctx.save(); ctx.font = `500 22px ${MONO}`; ctx.fillStyle = 'rgba(154,164,182,0.7)'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(tc, 72, h - 56);
  ctx.textAlign = 'right'; ctx.fillText('swit', w - 72, h - 56);
  // progress hairline
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(72, h - 36, w - 144, 2);
  const g = ctx.createLinearGradient(72, 0, w - 72, 0); g.addColorStop(0, C.c); g.addColorStop(1, C.c2);
  ctx.fillStyle = g; ctx.fillRect(72, h - 36, (w - 144) * clamp(gt / total), 2);
  ctx.restore();
}

/* ---------- shapes ---------- */
export function rr(ctx, x, y, w, h, r, { fill, stroke, lw = 2, alpha = 1, dash, shadow } = {}) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (shadow) { ctx.shadowColor = shadow.c; ctx.shadowBlur = shadow.b; ctx.shadowOffsetY = shadow.y || 0; }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.shadowColor = 'transparent';
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
  ctx.restore();
}

// Frosted glass panel with a soft shadow and a lit top edge.
export function glass(ctx, x, y, w, h, r = 28, { alpha = 1, tint = 'rgba(255,255,255,0.06)', glow } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.shadowColor = glow || 'rgba(0,0,0,0.55)'; ctx.shadowBlur = glow ? 80 : 70; ctx.shadowOffsetY = glow ? 0 : 30;
  ctx.fillStyle = 'rgba(14,17,24,0.82)'; ctx.fill(); ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = g; ctx.fill();
  const b = ctx.createLinearGradient(x, y, x + w, y + h); b.addColorStop(0, 'rgba(180,200,255,0.34)'); b.addColorStop(0.5, 'rgba(180,200,255,0.08)'); b.addColorStop(1, 'rgba(170,140,255,0.26)');
  ctx.strokeStyle = b; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
}

// App icon (design A).
const S_PATH = new Path2D('M342 188c-18-26-50-40-86-40-48 0-80 24-80 60 0 38 34 52 82 62 44 9 64 18 64 40 0 24-26 40-62 40-38 0-66-16-82-42');
const PLAY = new Path2D('M354 294l62 36-62 36z');
export function icon(ctx, x, y, s, alpha = 1, glowAmt = 0) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s / 512, s / 512);
  if (glowAmt > 0) { ctx.shadowColor = `rgba(110,150,255,${0.8 * glowAmt})`; ctx.shadowBlur = 90 * glowAmt; }
  rr(ctx, 0, 0, 512, 512, 112, { fill: '#0e1117' });
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, 0, 512, 512); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  rr(ctx, 0, 0, 512, 512, 112, { fill: g });
  rr(ctx, 24, 24, 464, 464, 92, { stroke: 'rgba(160,185,255,0.3)', lw: 4 });
  const sg = ctx.createLinearGradient(160, 150, 360, 380); sg.addColorStop(0, C.c); sg.addColorStop(1, C.c2);
  ctx.strokeStyle = sg; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(S_PATH);
  ctx.fillStyle = C.c2; ctx.fill(PLAY);
  ctx.restore();
}

/* ---------- text ---------- */
// Single line with blur-in + rise. p: 0..1 progress. Returns the width.
export function line(ctx, str, x, y, { size = 64, weight = 600, family = SANS, color = C.t, align = 'left', p = 1, rise = 40, blur = 14, glow, spacing = 0, fade = 1, dy = 0, out = 0 } = {}) {
  const k = eo5(p);
  ctx.save(); ctx.globalAlpha = clamp(p * 1.6) * fade * (1 - out); ctx.font = `${weight} ${size}px ${family}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (spacing) ctx.letterSpacing = spacing + 'px';
  const bl = Math.max(blur && k < 1 ? (1 - k) * blur : 0, out * blur);
  if (bl > 0.3) ctx.filter = `blur(${bl}px)`;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 40; }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y + dy + (1 - k) * rise);
  const wd = ctx.measureText(str).width; ctx.restore(); return wd;
}

// Word by word reveal. Each word starts `gap` seconds after the previous one.
export function words(ctx, str, x, y, t, t0, { gap = 0.07, dur = 0.7, size = 64, weight = 600, family = SANS, color = C.t, align = 'left', rise = 36, blur = 12, glow, fade = 1, dy = 0, out = 0 } = {}) {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`;
  const parts = str.split(' '), sp = ctx.measureText(' ').width, widths = parts.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.restore();
  parts.forEach((wd, i) => {
    line(ctx, wd, cx, y, { size, weight, family, color, p: clamp((t - t0 - i * gap) / dur), rise, blur, glow, fade, dy, out });
    cx += widths[i] + sp;
  });
  return total;
}

// Per character reveal (for the big wordmark).
export function chars(ctx, str, x, y, t, t0, { gap = 0.06, dur = 0.8, size = 200, weight = 700, family = SANS, color = C.t, align = 'left', rise = 80, blur = 24, glow } = {}) {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`;
  const ws = [...str].map((c) => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : x; ctx.restore();
  [...str].forEach((c, i) => { line(ctx, c, cx, y, { size, weight, family, color, p: clamp((t - t0 - i * gap) / dur), rise, blur, glow }); cx += ws[i]; });
  return total;
}

export function gradText(ctx, str, x, y, { size = 100, weight = 700, align = 'left', p = 1, blur = 18, rise = 50, glow, scale = 1 } = {}) {
  const k = eo5(p);
  ctx.save(); ctx.font = `${weight} ${size}px ${SANS}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  const wd = ctx.measureText(str).width, x0 = align === 'center' ? x - wd / 2 : x;
  const g = ctx.createLinearGradient(x0, 0, x0 + wd, 0); g.addColorStop(0, C.c); g.addColorStop(1, C.c2);
  ctx.globalAlpha = clamp(p * 1.6); if (blur && k < 1) ctx.filter = `blur(${(1 - k) * blur}px)`;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 50; }
  ctx.fillStyle = g; ctx.translate(x, y + (1 - k) * rise); ctx.scale(scale, scale); ctx.fillText(str, 0, 0); ctx.restore(); return wd;
}

/* ---------- ui bits ---------- */
export function cursor(ctx, x, y, s = 1, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(8, 27); ctx.lineTo(14, 40); ctx.lineTo(20, 37); ctx.lineTo(14, 25); ctx.lineTo(25, 25); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
export function ripple(ctx, x, y, p, color = C.c) {
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = (1 - p) * 0.8; ctx.lineWidth = 4 * (1 - p) + 1;
  ctx.beginPath(); ctx.arc(x, y, 8 + 70 * eo3(p), 0, 7); ctx.stroke(); ctx.restore();
}
export function spark(ctx, x, y, r, rot = 0, color = C.c, a = 1) { // four point star
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = r * 1.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rad = i % 2 ? r * 0.28 : r, ang = (i * Math.PI) / 4; ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

/* ---------- transitions ---------- */
// A skewed gradient band sweeps across the cut. mode 'in' covers the screen (end of scene), 'out' uncovers it (start of next).
export function wipe(ctx, w, h, t, d, { inT = 0.5, outT = 0.55 } = {}) {
  const skew = 260, band = (e, cover) => {
    // cover: fill left of e (cover) or right of e (uncover); polygon is a parallelogram edge leaning right
    ctx.save();
    ctx.beginPath();
    if (cover) { ctx.moveTo(-skew, 0); ctx.lineTo(e + skew, 0); ctx.lineTo(e, h); ctx.lineTo(-skew, h); }
    else { ctx.moveTo(e + skew, 0); ctx.lineTo(w + skew, 0); ctx.lineTo(w + skew, h); ctx.lineTo(e, h); }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a4bd8'); g.addColorStop(0.55, '#5b46e0'); g.addColorStop(1, '#8a5cff');
    ctx.fillStyle = g; ctx.fill();
    // bright leading edge
    ctx.strokeStyle = 'rgba(200,215,255,0.9)'; ctx.lineWidth = 5; ctx.shadowColor = '#9db4ff'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.moveTo(e + skew, 0); ctx.lineTo(e, h); ctx.stroke(); ctx.restore();
  };
  if (t > d - inT) { const k = eio((t - (d - inT)) / inT); band(mix(-skew, w + 1, k), true); }
  else if (t < outT) { const k = eio(t / outT); band(mix(-skew, w + 1, k), false); }
}
