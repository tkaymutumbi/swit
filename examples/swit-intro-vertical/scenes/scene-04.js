// Storyboard (vertical): five vertical frame cards (three drawn, two sketches), approve button, build bar.
import { C, SANS, MONO, background, wipe, words, rr, cursor, ripple, eo3, eio, clamp, mix } from './_kit.js';

// frames are drawn with proportions of their own box, so they work at any card size
function frame1(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#e8924a'; ctx.fillRect(x, y, w, h);
  const rise = eio((t - 1.0) / 1.6);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#f7e6c4'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * (1.15 - 0.45 * rise), w * 0.3, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${w * 0.13}px ${SANS}`; ctx.fillText('Mornings,', x + w * 0.1, y + h * 0.14); ctx.fillText('sorted.', x + w * 0.1, y + h * 0.14 + w * 0.16);
}
function frame3(ctx, x, y, w, h) {
  ctx.fillStyle = '#2f6b52'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#16322a'; ctx.fillRect(x + w * 0.1, y + h * 0.45, w * 0.8, h * 0.55);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f1e7d3' : '#e9805a'; ctx.fillRect(x + w * 0.1 + i * (w * 0.8 / 6), y + h * 0.38, w * 0.8 / 6, h * 0.08); }
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(x + w * 0.4, y + h * 0.62, w * 0.2, h * 0.26);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${w * 0.12}px ${SANS}`; ctx.fillText('Your corner', x + w * 0.1, y + h * 0.13); ctx.fillText('shop', x + w * 0.1, y + h * 0.13 + w * 0.15);
}
function frame5(ctx, x, y, w, h) {
  ctx.fillStyle = '#0f1115'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f1e7d3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.42, w * 0.2, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${w * 0.14}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Brew &', x + w / 2, y + h * 0.72); ctx.fillText('Co.', x + w / 2, y + h * 0.72 + w * 0.17); ctx.textAlign = 'left';
}
function sketch(ctx, x, y, w, h, gt, kind) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(141,147,156,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([12, 9]); ctx.lineDashOffset = -gt * 30;
  ctx.beginPath();
  if (kind === 0) { ctx.moveTo(x + w * 0.3, y + h * 0.36); ctx.lineTo(x + w * 0.36, y + h * 0.62); ctx.lineTo(x + w * 0.64, y + h * 0.62); ctx.lineTo(x + w * 0.7, y + h * 0.36); ctx.closePath(); ctx.moveTo(x + w * 0.5, y + h * 0.3); ctx.lineTo(x + w * 0.5, y + h * 0.22); }
  else { ctx.roundRect(x + w * 0.14, y + h * 0.36, w * 0.72, h * 0.24, 8); ctx.moveTo(x + w * 0.26, y + h * 0.48); ctx.lineTo(x + w * 0.74, y + h * 0.48); }
  ctx.stroke(); ctx.restore();
}

export default {
  draw(ctx, t, { w, h, gt, duration, safe }) {
    background(ctx, w, h);
    const X = safe.x, W = safe.w;

    ['Check the', 'storyboard', 'first.'].forEach((l, i) => words(ctx, l, X, 330 + i * 125, t, 0.1 + i * 0.15, { size: 118, weight: 700 }));
    words(ctx, 'A few frames are drawn.', X, 760, t, 0.6, { size: 44, weight: 400, color: C.s, gap: 0.04 });
    words(ctx, 'The rest wait for your OK.', X, 820, t, 0.8, { size: 44, weight: 400, color: C.s, gap: 0.04 });

    const gap = 14, cw = (W - gap * 4) / 5, ch = cw * 16 / 9, y0 = 890;
    const names = ['Mornings', 'The pour', 'The shop', 'Offer', 'Brew & Co.'];
    for (let i = 0; i < 5; i++) {
      const k = eo3((t - 0.7 - i * 0.16) / 0.55), a = clamp(k * 1.8);
      const x = X + i * (cw + gap), y = y0 + (1 - k) * 40;
      ctx.save(); ctx.globalAlpha = a;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 10); ctx.clip();
      if (i === 0) frame1(ctx, x, y, cw, ch, t); else if (i === 2) frame3(ctx, x, y, cw, ch); else if (i === 4) frame5(ctx, x, y, cw, ch);
      else { ctx.fillStyle = C.p; ctx.fillRect(x, y, cw, ch); sketch(ctx, x, y, cw, ch, gt, i === 1 ? 0 : 1); }
      ctx.restore();
      rr(ctx, x, y, cw, ch, 10, { stroke: '#343941', lw: 1.5 });
      ctx.fillStyle = i % 2 ? C.s : C.t; ctx.font = `500 22px ${SANS}`; ctx.fillText(`${i + 1}`, x + 2, y + ch + 34);
      ctx.restore();
    }

    // approve button, cursor, click, build bar
    const bk = eo3((t - 2.6) / 0.5), bx = X, by = 1290, bw = W, bh = 104;
    const press = t > 3.85 && t < 4.0 ? 0.97 : 1, clicked = t > 3.9;
    ctx.save(); ctx.globalAlpha = bk; ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    rr(ctx, bx, by, bw, bh, 18, { fill: C.c });
    ctx.fillStyle = C.ci; ctx.font = `700 40px ${SANS}`; ctx.textAlign = 'center';
    ctx.fillText(clicked ? 'Approved. Building video' : 'Approve & build video', bx + bw / 2, by + 66); ctx.textAlign = 'left';
    ctx.restore();
    if (clicked) { const f = eio((t - 3.95) / 0.95); rr(ctx, bx, by + bh + 24, bw, 6, 3, { fill: '#262a31' }); rr(ctx, bx, by + bh + 24, Math.max(6, bw * f), 6, 3, { fill: C.c }); }
    const cp = eio((t - 2.9) / 0.95), tx = bx + bw * 0.7, ty = by + 54;
    if (t > 2.7) cursor(ctx, mix(w - 200, tx, cp), mix(by + 330, ty, cp), 1.1, clamp((t - 2.7) / 0.3));
    ripple(ctx, tx, ty, (t - 3.9) / 0.55);

    wipe(ctx, w, h, t, duration);
  },
};
