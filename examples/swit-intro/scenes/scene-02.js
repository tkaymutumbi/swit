// What is Swit: icon, wordmark, one sentence, three feature chips.
import { C, SANS, MONO, background, wipe, words, chars, rr, icon, spring, eo3, clamp } from './_kit.js';

function iconCode(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 18, y); ctx.lineTo(x - 8, y + 10); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 18, y); ctx.lineTo(x + 8, y + 10); ctx.stroke(); }
function iconGrid(ctx, x, y) { for (const [dx, dy] of [[-12, -12], [2, -12], [-12, 2], [2, 2]]) { ctx.beginPath(); ctx.roundRect(x + dx, y + dy, 10, 10, 2); ctx.stroke(); } }
function iconChat(ctx, x, y) { ctx.beginPath(); ctx.roundRect(x - 16, y - 13, 32, 22, 6); ctx.moveTo(x - 6, y + 9); ctx.lineTo(x - 10, y + 17); ctx.lineTo(x + 2, y + 9); ctx.stroke(); }

export default {
  draw(ctx, t, { w, h, duration }) {
    background(ctx, w, h);

    const ik = spring((t - 0.15) / 0.7), s = 300 * ik;
    icon(ctx, 160 + (300 - s) / 2, 280 + (300 - s) / 2, s, clamp(ik));

    chars(ctx, 'Swit', 540, 490, t, 0.35, { size: 250, gap: 0.07 });
    words(ctx, 'A video studio where Claude writes', 548, 575, t, 1.0, { size: 54, weight: 400, color: C.s, gap: 0.05 });
    words(ctx, 'the video as code.', 548, 641, t, 1.35, { size: 54, weight: 400, color: C.s, gap: 0.05 });

    const pills = [['JS scenes', iconCode], ['Storyboard first', iconGrid], ['Review with comments', iconChat]];
    ctx.save(); ctx.font = `500 28px ${MONO}`;
    const pws = pills.map(([label]) => 84 + ctx.measureText(label).width + 30); ctx.restore();
    let x = 160;
    pills.forEach(([label, drawIcon], i) => {
      const k = eo3((t - 2.1 - i * 0.35) / 0.5), y = 770 + (1 - k) * 18, pw = pws[i], ph = 76;
      ctx.save(); ctx.globalAlpha = clamp(k * 1.8);
      rr(ctx, x, y, pw, ph, 38, { stroke: '#343941', lw: 1.5 });
      ctx.strokeStyle = C.c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawIcon(ctx, x + 42, y + ph / 2);
      ctx.fillStyle = C.t; ctx.font = `500 28px ${MONO}`; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, x + 78, y + ph / 2 + 10);
      ctx.restore();
      x += pw + 20;
    });
    wipe(ctx, w, h, t, duration);
  },
};
