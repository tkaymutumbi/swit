// Ask: a typed request in a terminal panel, then Claude's questions as chips.
import { C, SANS, MONO, background, wipe, words, panel, rr, spring, eo3, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration }) {
    background(ctx, w, h);

    words(ctx, 'Ask for a video.', 160, 205, t, 0.1, { size: 96, weight: 700 });
    words(ctx, 'Claude asks a few questions first.', 160, 285, t, 0.5, { size: 46, weight: 400, color: C.s, gap: 0.05 });

    // terminal
    const wk = eo3((t - 0.3) / 0.6), wy = 350 + (1 - wk) * 24;
    panel(ctx, 160, wy, 1600, 230, 18, { alpha: wk });
    ctx.save(); ctx.globalAlpha = wk;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#2f343c'; ctx.beginPath(); ctx.arc(200 + i * 28, wy + 38, 7, 0, 7); ctx.fill(); }
    ctx.fillStyle = C.s; ctx.font = `400 22px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('claude', 1722, wy + 45); ctx.textAlign = 'left';
    ctx.restore();
    const msg = 'create a pro video that explains my product';
    const n = Math.floor(msg.length * clamp((t - 0.9) / 1.5));
    ctx.save(); ctx.globalAlpha = wk; ctx.font = `500 46px ${MONO}`;
    ctx.fillStyle = C.c; ctx.fillText('>', 205, wy + 160);
    ctx.fillStyle = C.t; const typed = msg.slice(0, n); ctx.fillText(typed, 265, wy + 160);
    const cx = 265 + ctx.measureText(typed).width;
    if (n < msg.length || Math.floor(t * 2.4) % 2 === 0) { ctx.fillStyle = C.c; ctx.fillRect(cx + 4, wy + 120, 5, 54); }
    ctx.restore();

    // reply
    const rk = eo3((t - 2.55) / 0.6), ry = 625 + (1 - rk) * 24;
    panel(ctx, 160, ry, 1600, 215, 18, { alpha: rk });
    words(ctx, 'Quick questions first', 205, ry + 70, t, 2.7, { size: 40, weight: 600, gap: 0.08 });
    const qs = [['Length', '30s'], ['Audience', 'developers'], ['Style', 'dark and blue'], ['Ending', 'GitHub link']];
    let x = 205, y = ry + 112;
    qs.forEach(([a, b], i) => {
      const k = spring((t - 3.1 - i * 0.3) / 0.55), al = clamp(k * 1.6);
      ctx.save(); ctx.font = `400 32px ${SANS}`; const wa = ctx.measureText(a + '  ').width; ctx.font = `600 32px ${SANS}`; const wb = ctx.measureText(b).width; ctx.restore();
      const pw = wa + wb + 60, ph = 66;
      if (x + pw > 1710) { x = 205; y += 84; }
      ctx.save(); ctx.globalAlpha = al; const sc = 0.92 + 0.08 * k; ctx.translate(x + pw / 2, y + ph / 2); ctx.scale(sc, sc); ctx.translate(-(x + pw / 2), -(y + ph / 2));
      rr(ctx, x, y, pw, ph, 33, { stroke: C.c, lw: 2 });
      ctx.font = `400 32px ${SANS}`; ctx.fillStyle = C.s; ctx.fillText(a, x + 30, y + 44);
      ctx.font = `600 32px ${SANS}`; ctx.fillStyle = C.c; ctx.fillText(b, x + 30 + wa, y + 44);
      ctx.restore();
      x += pw + 16;
    });
    wipe(ctx, w, h, t, duration);
  },
};
