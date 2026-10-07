// What is Swit (vertical): icon, wordmark, sentence over three lines, three chips stacked.
import { C, SANS, MONO, background, wipe, words, chars, rr, icon, spring, eo3, clamp } from './_kit.js';

function iconCode(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 18, y); ctx.lineTo(x - 8, y + 10); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 18, y); ctx.lineTo(x + 8, y + 10); ctx.stroke(); }
function iconGrid(ctx, x, y) { for (const [dx, dy] of [[-12, -12], [2, -12], [-12, 2], [2, 2]]) { ctx.beginPath(); ctx.roundRect(x + dx, y + dy, 10, 10, 2); ctx.stroke(); } }
function iconChat(ctx, x, y) { ctx.beginPath(); ctx.roundRect(x - 16, y - 13, 32, 22, 6); ctx.moveTo(x - 6, y + 9); ctx.lineTo(x - 10, y + 17); ctx.lineTo(x + 2, y + 9); ctx.stroke(); }

export default {
  draw(ctx, t, { w, h, duration, safe }) {
    background(ctx, w, h);
    const X = safe.x;

    const ik = spring((t - 0.15) / 0.7), s = 260 * ik;
    icon(ctx, X + (260 - s) / 2, 330 + (260 - s) / 2, s, clamp(ik));

    chars(ctx, 'Swit', X - 6, 900, t, 0.35, { size: 270, gap: 0.07 });
    ['A video studio where', 'Claude writes the', 'video as code.'].forEach((l, i) =>
      words(ctx, l, X, 1000 + i * 70, t, 1.0 + i * 0.3, { size: 54, weight: 400, color: C.s, gap: 0.05 }));

    const pills = [['JS scenes', iconCode], ['Storyboard first', iconGrid], ['Review with comments', iconChat]];
    ctx.save(); ctx.font = `500 30px ${MONO}`;
    const pws = pills.map(([label]) => 90 + ctx.measureText(label).width + 30); ctx.restore();
    pills.forEach(([label, drawIcon], i) => {
      const k = eo3((t - 2.1 - i * 0.35) / 0.5), y = 1260 + i * 104 + (1 - k) * 18, pw = pws[i], ph = 82;
      ctx.save(); ctx.globalAlpha = clamp(k * 1.8);
      rr(ctx, X, y, pw, ph, 41, { stroke: '#343941', lw: 1.5 });
      ctx.strokeStyle = C.c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawIcon(ctx, X + 44, y + ph / 2);
      ctx.fillStyle = C.t; ctx.font = `500 30px ${MONO}`; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, X + 84, y + ph / 2 + 11);
      ctx.restore();
    });
    wipe(ctx, w, h, t, duration);
  },
};
