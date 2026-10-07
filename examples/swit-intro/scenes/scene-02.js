// What is Swit: icon with pulse rings, wordmark, one sentence, three feature pills.
import { C, SANS, MONO, background, finish, hud, wipe, words, chars, glass, icon, spark, spring, eo3, clamp } from './_kit.js';

function iconCode(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 18, y); ctx.lineTo(x - 8, y + 10); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 18, y); ctx.lineTo(x + 8, y + 10); ctx.stroke(); }
function iconGrid(ctx, x, y) { for (const [dx, dy] of [[-12, -12], [2, -12], [-12, 2], [2, 2]]) { ctx.beginPath(); ctx.roundRect(x + dx, y + dy, 10, 10, 2); ctx.stroke(); } }
function iconChat(ctx, x, y) { ctx.beginPath(); ctx.roundRect(x - 16, y - 13, 32, 22, 6); ctx.moveTo(x - 6, y + 9); ctx.lineTo(x - 10, y + 17); ctx.lineTo(x + 2, y + 9); ctx.stroke(); }

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt);
    ctx.save();
    const z = 1.04 - 0.04 * (t / duration); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    // icon + pulse rings
    const cx = 410, cy = 430, ik = spring((t - 0.15) / 0.8), s = 320 * ik;
    for (let i = 0; i < 3; i++) {
      const p = ((t - 0.5 - i * 0.55) % 1.65) / 1.65; if (t < 0.5 + i * 0.55 || p < 0) continue;
      ctx.save(); ctx.strokeStyle = `rgba(143,180,255,${0.35 * (1 - p)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(cx - 160 - 120 * p, cy - 160 - 120 * p, 320 + 240 * p, 320 + 240 * p, 90 + 90 * p); ctx.stroke(); ctx.restore();
    }
    icon(ctx, cx - s / 2, cy - s / 2, s, clamp(ik), 1);
    for (let i = 0; i < 3; i++) { const a = gt * 0.9 + i * 2.094; spark(ctx, cx + Math.cos(a) * 250, cy + Math.sin(a) * 250, 12 + 4 * i, a * 2, i === 1 ? C.c2 : C.c, 0.85 * clamp(ik)); }

    // wordmark + sentence
    chars(ctx, 'Swit', 700, 470, t, 0.4, { size: 220, gap: 0.08, glow: 'rgba(120,150,255,0.35)' });
    words(ctx, 'A video studio where Claude writes', 708, 560, t, 1.1, { size: 54, weight: 400, color: C.s, gap: 0.06 });
    words(ctx, 'the video as code.', 708, 626, t, 1.5, { size: 54, weight: 400, color: C.s, gap: 0.06 });

    // pills
    const pills = [['JS scenes', iconCode], ['Storyboard first', iconGrid], ['Review with comments', iconChat]];
    ctx.save(); ctx.font = `500 28px ${MONO}`;
    const pws = pills.map(([label]) => 84 + ctx.measureText(label).width + 36); ctx.restore();
    let x = (w - (pws.reduce((a, b) => a + b, 0) + 22 * 2)) / 2;
    pills.forEach(([label, drawIcon], i) => {
      const k = spring((t - 2.1 - i * 0.35) / 0.7), a = clamp(k), pw = pws[i];
      const y = 770, ph = 80, sc = 0.75 + 0.25 * k;
      ctx.save(); ctx.translate(x + pw / 2, y + ph / 2); ctx.scale(sc, sc); ctx.translate(-(x + pw / 2), -(y + ph / 2));
      glass(ctx, x, y, pw, ph, 40, { alpha: a });
      ctx.globalAlpha = a; ctx.strokeStyle = C.c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawIcon(ctx, x + 44, y + ph / 2);
      ctx.fillStyle = C.t; ctx.font = `500 28px ${MONO}`; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, x + 82, y + ph / 2 + 10);
      ctx.restore();
      x += pw + 22;
    });
    ctx.restore();
    wipe(ctx, w, h, t, duration);
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
