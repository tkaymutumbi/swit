// Storyboard: five frame cards (three drawn, two sketches), a cursor approves, a build bar fills.
import { C, SANS, MONO, background, finish, hud, wipe, words, glass, cursor, ripple, spring, eo3, eio, clamp, mix } from './_kit.js';

// tiny illustrated frames, all drawn with paths
function frame1(ctx, x, y, w, h, t) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#f6c07a'); g.addColorStop(1, '#d9722f'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const rise = eio((t - 1.0) / 1.6);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = 'rgba(255,244,220,0.95)'; ctx.shadowColor = '#fff2c8'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * (1.05 - 0.55 * rise), h * 0.2, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = `700 26px ${SANS}`; ctx.fillText('Mornings,', x + 20, y + 52); ctx.fillText('sorted.', x + 20, y + 84);
}
function frame3(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#4f8a6e'); g.addColorStop(1, '#1b3a2c'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#12261d'; ctx.fillRect(x + 28, y + 70, w - 56, h - 70);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f1e7d3' : '#e9805a'; ctx.fillRect(x + 28 + i * ((w - 56) / 6), y + 52, (w - 56) / 6, 24); }
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(x + w / 2 - 22, y + 100, 44, 70); ctx.fillStyle = '#fff'; ctx.font = `700 22px ${SANS}`; ctx.fillText('Your corner shop', x + 24, y + 38);
}
function frame5(ctx, x, y, w, h) {
  ctx.fillStyle = '#0d0f14'; ctx.fillRect(x, y, w, h);
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.6); g.addColorStop(0, 'rgba(120,150,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f1e7d3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 - 12, 34, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 28px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Brew & Co.', x + w / 2, y + h - 34); ctx.textAlign = 'left';
}
function sketch(ctx, x, y, w, h, gt, kind) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(154,164,182,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -gt * 30;
  ctx.beginPath();
  if (kind === 0) { ctx.moveTo(x + w * 0.38, y + h * 0.28); ctx.lineTo(x + w * 0.42, y + h * 0.62); ctx.lineTo(x + w * 0.56, y + h * 0.62); ctx.lineTo(x + w * 0.6, y + h * 0.28); ctx.closePath(); ctx.moveTo(x + w * 0.5, y + h * 0.2); ctx.lineTo(x + w * 0.5, y + h * 0.1); }
  else { ctx.roundRect(x + w * 0.2, y + h * 0.25, w * 0.6, h * 0.5, 8); ctx.moveTo(x + w * 0.32, y + h * 0.5); ctx.lineTo(x + w * 0.68, y + h * 0.5); }
  ctx.stroke(); ctx.restore();
}

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt);
    ctx.save();
    const z = 1 + 0.03 * (t / duration); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    words(ctx, 'Check the storyboard first.', 240, 200, t, 0.1, { size: 86, weight: 700 });
    words(ctx, 'A few frames are drawn. The rest wait for your OK.', 240, 280, t, 0.6, { size: 46, weight: 400, color: C.s, gap: 0.04 });

    const cw = 330, ch = 186, gap = 24, x0 = (w - (cw * 5 + gap * 4)) / 2, y0 = 400;
    const names = ['Mornings', 'The pour', 'The shop', 'Offer', 'Brew & Co.'];
    for (let i = 0; i < 5; i++) {
      const k = spring((t - 0.7 - i * 0.18) / 0.75), a = clamp(k);
      const x = x0 + i * (cw + gap), y = y0 + (1 - k) * 70;
      ctx.save(); ctx.globalAlpha = a;
      glass(ctx, x - 10, y - 10, cw + 20, ch + 56, 22, { alpha: 1 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.clip();
      if (i === 0) frame1(ctx, x, y, cw, ch, t); else if (i === 2) frame3(ctx, x, y, cw, ch); else if (i === 4) frame5(ctx, x, y, cw, ch);
      else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x, y, cw, ch); sketch(ctx, x, y, cw, ch, gt, i === 1 ? 0 : 1); }
      ctx.restore();
      ctx.fillStyle = i % 2 ? C.s : C.t; ctx.font = `500 26px ${SANS}`; ctx.fillText(`${i + 1}  ${names[i]}`, x + 4, y + ch + 34);
      if (i % 2) { ctx.fillStyle = C.s; ctx.font = `400 20px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('sketch', x + cw - 4, y + ch + 34); }
      ctx.restore();
    }

    // approve button, cursor, click, build bar
    const bk = eo3((t - 2.6) / 0.6), bx = w / 2 - 300, by = 760, bw = 600, bh = 104;
    const press = t > 3.85 && t < 4.0 ? 0.96 : 1, clicked = t > 3.9;
    ctx.save(); ctx.globalAlpha = bk; ctx.translate(w / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-w / 2, -(by + bh / 2));
    const pulse = 0.5 + 0.5 * Math.sin(gt * 4);
    ctx.shadowColor = `rgba(120,150,255,${clicked ? 0.9 : 0.35 + 0.25 * pulse})`; ctx.shadowBlur = clicked ? 90 : 50;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#7ea3ff'); g.addColorStop(1, '#a98bff');
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 26); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.ci; ctx.font = `700 40px ${SANS}`; ctx.textAlign = 'center';
    ctx.fillText(clicked ? 'Approved. Building video' : 'Approve & build video', w / 2, by + 66); ctx.textAlign = 'left';
    ctx.restore();
    if (clicked) { const f = eio((t - 3.95) / 0.95); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by + bh + 22, bw, 6); ctx.fillStyle = C.c; ctx.fillRect(bx, by + bh + 22, bw * f, 6); }
    const cp = eio((t - 2.9) / 0.95);
    if (t > 2.7) cursor(ctx, mix(w - 360, w / 2 + 120, cp), mix(by + 280, by + 54, cp), 1.1, clamp((t - 2.7) / 0.3));
    ripple(ctx, w / 2 + 120, by + 54, (t - 3.9) / 0.55);
    ctx.restore();

    wipe(ctx, w, h, t, duration);
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
