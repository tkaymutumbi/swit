// Swit intro look: flat dark neutral, one blue accent, off-white type, hairline panels.
// No glow, no gradients, no particles. Motion is short and eased. All functions are pure in time.
export const C = { bg: '#0d0e10', p: '#14161a', r: '#1b1e23', l: '#272b32', t: '#f2f1ee', s: '#8d939c', c: '#8fb4ff', ci: '#0b0f18', ok: '#6fd19a' };
export const SANS = '"IBM Plex Sans", Inter, sans-serif';
export const MONO = '"IBM Plex Mono", monospace';

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, k) => a + (b - a) * k;
export const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const eo5 = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const spring = (x) => { x = clamp(x); return 1 - Math.exp(-9 * x) * Math.cos(7 * x); }; // small, quick overshoot
export const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

export function background(ctx, w, h) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); }

export function rr(ctx, x, y, w, h, r, { fill, stroke, lw = 2, alpha = 1, dash } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
  ctx.restore();
}

// Flat panel with a hairline border.
export function panel(ctx, x, y, w, h, r = 18, { alpha = 1, fill = C.p } = {}) { rr(ctx, x, y, w, h, r, { fill, stroke: C.l, lw: 1.5, alpha }); }

// App icon (design A): dark tile, blue S, blue play mark. Flat.
const S_PATH = new Path2D('M342 188c-18-26-50-40-86-40-48 0-80 24-80 60 0 38 34 52 82 62 44 9 64 18 64 40 0 24-26 40-62 40-38 0-66-16-82-42');
const PLAY = new Path2D('M354 294l62 36-62 36z');
export function icon(ctx, x, y, s, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s / 512, s / 512);
  rr(ctx, 0, 0, 512, 512, 112, { fill: '#14171d' });
  rr(ctx, 24, 24, 464, 464, 92, { stroke: '#2d3340', lw: 4 });
  ctx.strokeStyle = C.c; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(S_PATH);
  ctx.fillStyle = C.c; ctx.fill(PLAY);
  ctx.restore();
}

/* ---------- text ---------- */
export function line(ctx, str, x, y, { size = 64, weight = 600, family = SANS, color = C.t, align = 'left', p = 1, rise = 26, fade = 1, dy = 0, out = 0 } = {}) {
  const k = eo5(p);
  ctx.save(); ctx.globalAlpha = clamp(p * 1.8) * fade * (1 - out); ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (size >= 70) ctx.letterSpacing = `${-size * 0.018}px`;
  ctx.fillStyle = color; ctx.fillText(str, x, y + dy + (1 - k) * rise);
  const wd = ctx.measureText(str).width; ctx.restore(); return wd;
}

// Word by word reveal.
export function words(ctx, str, x, y, t, t0, { gap = 0.07, dur = 0.6, size = 64, weight = 600, family = SANS, color = C.t, align = 'left', rise = 26, fade = 1, dy = 0, out = 0 } = {}) {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`; if (size >= 70) ctx.letterSpacing = `${-size * 0.018}px`;
  const parts = str.split(' '), sp = ctx.measureText(' ').width, widths = parts.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; ctx.restore();
  parts.forEach((wd, i) => { line(ctx, wd, cx, y, { size, weight, family, color: typeof color === 'function' ? color(wd, i) : color, p: clamp((t - t0 - i * gap) / dur), rise, fade, dy, out }); cx += widths[i] + sp; });
  return total;
}

export function chars(ctx, str, x, y, t, t0, { gap = 0.05, dur = 0.6, size = 200, weight = 700, family = SANS, color = C.t, align = 'left', rise = 40 } = {}) {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`; ctx.letterSpacing = `${-size * 0.018}px`;
  const ws = [...str].map((c) => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : x; ctx.restore();
  [...str].forEach((c, i) => { line(ctx, c, cx, y, { size, weight, family, color, p: clamp((t - t0 - i * gap) / dur), rise }); cx += ws[i]; });
  return total;
}

/* ---------- ui bits ---------- */
export function cursor(ctx, x, y, s = 1, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(8, 27); ctx.lineTo(14, 40); ctx.lineTo(20, 37); ctx.lineTo(14, 25); ctx.lineTo(25, 25); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#0b0f18'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
export function ripple(ctx, x, y, p, color = C.c) {
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = (1 - p) * 0.9; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 8 + 56 * eo3(p), 0, 7); ctx.stroke(); ctx.restore();
}

/* ---------- transitions ---------- */
// A flat curtain crosses the cut: covers the screen at the end of a scene, uncovers it at the start of the next.
export function wipe(ctx, w, h, t, d, { inT = 0.45, outT = 0.5 } = {}) {
  const draw = (x0, x1, edge) => {
    ctx.fillStyle = '#171a1f'; ctx.fillRect(x0, 0, x1 - x0, h);
    ctx.fillStyle = C.c; ctx.fillRect(edge - 2, 0, 4, h);
  };
  if (t > d - inT) { const e = w * eio((t - (d - inT)) / inT); draw(0, e, e); }
  else if (t < outT) { const e = w * eio(t / outT); draw(e, w, e); }
}
