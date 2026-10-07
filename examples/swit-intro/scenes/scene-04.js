// Storyboard: five frame cards (three drawn, two sketches), a cursor approves, a build bar fills.
import { C, SANS, MONO, background, wipe, words, panel, rr, cursor, ripple, spring, eo3, eio, clamp, mix } from './_kit.js';

// small illustrated frames, all drawn with shapes
function frame1(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#e8924a'; ctx.fillRect(x, y, w, h);
  const rise = eio((t - 1.0) / 1.6);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#f7e6c4'; ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * (1.05 - 0.55 * rise), h * 0.2, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = `700 24px ${SANS}`; ctx.fillText('Mornings,', x + 18, y + 48); ctx.fillText('sorted.', x + 18, y + 78);
}
function frame3(ctx, x, y, w, h) {
  ctx.fillStyle = '#2f6b52'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#16322a'; ctx.fillRect(x + 26, y + 66, w - 52, h - 66);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f1e7d3' : '#e9805a'; ctx.fillRect(x + 26 + i * ((w - 52) / 6), y + 48, (w - 52) / 6, 22); }
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(x + w / 2 - 20, y + 94, 40, 64); ctx.fillStyle = '#fff'; ctx.font = `700 20px ${SANS}`; ctx.fillText('Your corner shop', x + 22, y + 34);
}
function frame5(ctx, x, y, w, h) {
  ctx.fillStyle = '#0f1115'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f1e7d3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 - 12, 32, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Brew & Co.', x + w / 2, y + h - 30); ctx.textAlign = 'left';
}
function sketch(ctx, x, y, w, h, gt, kind) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(141,147,156,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -gt * 30;
  ctx.beginPath();
  if (kind === 0) { ctx.moveTo(x + w * 0.38, y + h * 0.28); ctx.lineTo(x + w * 0.42, y + h * 0.62); ctx.lineTo(x + w * 0.56, y + h * 0.62); ctx.lineTo(x + w * 0.6, y + h * 0.28); ctx.closePath(); ctx.moveTo(x + w * 0.5, y + h * 0.2); ctx.lineTo(x + w * 0.5, y + h * 0.1); }
  else { ctx.roundRect(x + w * 0.2, y + h * 0.25, w * 0.6, h * 0.5, 8); ctx.moveTo(x + w * 0.32, y + h * 0.5); ctx.lineTo(x + w * 0.68, y + h * 0.5); }
  ctx.stroke(); ctx.restore();
}

export default {
  draw(ctx, t, { w, h, gt, duration }) {
    background(ctx, w, h);

    words(ctx, 'Check the storyboard first.', 160, 205, t, 0.1, { size: 96, weight: 700 });
    words(ctx, 'A few frames are drawn. The rest wait for your OK.', 160, 285, t, 0.6, { size: 46, weight: 400, color: C.s, gap: 0.04 });

    const cw = 300, ch = 169, gap = 25, x0 = 160, y0 = 410;
    const names = ['Mornings', 'The pour', 'The shop', 'Offer', 'Brew & Co.'];
    for (let i = 0; i < 5; i++) {
      const k = eo3((t - 0.7 - i * 0.16) / 0.55), a = clamp(k * 1.8);
      const x = x0 + i * (cw + gap), y = y0 + (1 - k) * 40;
      ctx.save(); ctx.globalAlpha = a;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 12); ctx.clip();
      if (i === 0) frame1(ctx, x, y, cw, ch, t); else if (i === 2) frame3(ctx, x, y, cw, ch); else if (i === 4) frame5(ctx, x, y, cw, ch);
      else { ctx.fillStyle = C.p; ctx.fillRect(x, y, cw, ch); sketch(ctx, x, y, cw, ch, gt, i === 1 ? 0 : 1); }
      ctx.restore();
      rr(ctx, x, y, cw, ch, 12, { stroke: '#343941', lw: 1.5 });
      ctx.fillStyle = i % 2 ? C.s : C.t; ctx.font = `500 26px ${SANS}`; ctx.fillText(`${i + 1}  ${names[i]}`, x + 2, y + ch + 38);
      if (i % 2) { ctx.fillStyle = C.s; ctx.font = `400 20px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('sketch', x + cw - 2, y + ch + 38); }
      ctx.restore();
    }

    // approve button, cursor, click, build bar
    const bk = eo3((t - 2.6) / 0.5), bx = 160, by = 740, bw = 620, bh = 100;
    const press = t > 3.85 && t < 4.0 ? 0.97 : 1, clicked = t > 3.9;
    ctx.save(); ctx.globalAlpha = bk; ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    rr(ctx, bx, by, bw, bh, 18, { fill: C.c });
    ctx.fillStyle = C.ci; ctx.font = `700 40px ${SANS}`; ctx.textAlign = 'center';
    ctx.fillText(clicked ? 'Approved. Building video' : 'Approve & build video', bx + bw / 2, by + 64); ctx.textAlign = 'left';
    ctx.restore();
    if (clicked) { const f = eio((t - 3.95) / 0.95); rr(ctx, bx, by + bh + 22, bw, 6, 3, { fill: '#262a31' }); rr(ctx, bx, by + bh + 22, Math.max(6, bw * f), 6, 3, { fill: C.c }); }
    const cp = eio((t - 2.9) / 0.95), tx = bx + bw * 0.7, ty = by + 52;
    if (t > 2.7) cursor(ctx, mix(w - 300, tx, cp), mix(by + 300, ty, cp), 1.1, clamp((t - 2.7) / 0.3));
    ripple(ctx, tx, ty, (t - 3.9) / 0.55);

    wipe(ctx, w, h, t, duration);
  },
};
