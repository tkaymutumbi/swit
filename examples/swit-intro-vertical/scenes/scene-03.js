// Ask (vertical): headline, a typed prompt over two lines, question chips that wrap.
import { C, SANS, MONO, background, wipe, words, panel, rr, spring, eo3, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration, safe }) {
    background(ctx, w, h);
    const X = safe.x, W = safe.w;

    words(ctx, 'Ask for a', X, 330, t, 0.1, { size: 128, weight: 700 });
    words(ctx, 'video.', X, 465, t, 0.25, { size: 128, weight: 700 });
    words(ctx, 'Claude asks a few', X, 560, t, 0.5, { size: 48, weight: 400, color: C.s, gap: 0.05 });
    words(ctx, 'questions first.', X, 622, t, 0.7, { size: 48, weight: 400, color: C.s, gap: 0.05 });

    // terminal
    const wk = eo3((t - 0.3) / 0.6), wy = 720 + (1 - wk) * 24;
    panel(ctx, X, wy, W, 300, 18, { alpha: wk });
    ctx.save(); ctx.globalAlpha = wk;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#2f343c'; ctx.beginPath(); ctx.arc(X + 36 + i * 28, wy + 38, 7, 0, 7); ctx.fill(); }
    ctx.fillStyle = C.s; ctx.font = `400 22px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('claude', X + W - 30, wy + 45); ctx.textAlign = 'left';
    ctx.restore();
    const l1 = 'create a pro video', l2 = 'that explains my product', n = Math.floor((l1.length + l2.length) * clamp((t - 0.9) / 1.5));
    ctx.save(); ctx.globalAlpha = wk; ctx.font = `500 42px ${MONO}`;
    ctx.fillStyle = C.c; ctx.fillText('>', X + 36, wy + 150);
    ctx.fillStyle = C.t;
    const a = l1.slice(0, n), b = n > l1.length ? l2.slice(0, n - l1.length) : '';
    ctx.fillText(a, X + 86, wy + 150); ctx.fillText(b, X + 86, wy + 218);
    const cy = n > l1.length ? wy + 218 : wy + 150, cx = X + 86 + ctx.measureText(n > l1.length ? b : a).width;
    if (n < l1.length + l2.length || Math.floor(t * 2.4) % 2 === 0) { ctx.fillStyle = C.c; ctx.fillRect(cx + 4, cy - 40, 5, 52); }
    ctx.restore();

    // reply
    const rk = eo3((t - 2.55) / 0.6), ry = 1060 + (1 - rk) * 24;
    panel(ctx, X, ry, W, 430, 18, { alpha: rk });
    words(ctx, 'Quick questions first', X + 40, ry + 80, t, 2.7, { size: 42, weight: 600, gap: 0.08 });
    const qs = [['Length', '30s'], ['Audience', 'developers'], ['Style', 'dark and blue'], ['Ending', 'GitHub link']];
    let x = X + 40, y = ry + 130;
    qs.forEach(([a1, b1], i) => {
      const k = spring((t - 3.1 - i * 0.3) / 0.55), al = clamp(k * 1.6);
      ctx.save(); ctx.font = `400 34px ${SANS}`; const wa = ctx.measureText(a1 + '  ').width; ctx.font = `600 34px ${SANS}`; const wb = ctx.measureText(b1).width; ctx.restore();
      const pw = wa + wb + 60, ph = 72;
      if (x + pw > X + W - 30) { x = X + 40; y += 92; }
      ctx.save(); ctx.globalAlpha = al; const sc = 0.92 + 0.08 * k; ctx.translate(x + pw / 2, y + ph / 2); ctx.scale(sc, sc); ctx.translate(-(x + pw / 2), -(y + ph / 2));
      rr(ctx, x, y, pw, ph, 36, { stroke: C.c, lw: 2 });
      ctx.font = `400 34px ${SANS}`; ctx.fillStyle = C.s; ctx.fillText(a1, x + 30, y + 48);
      ctx.font = `600 34px ${SANS}`; ctx.fillStyle = C.c; ctx.fillText(b1, x + 30 + wa, y + 48);
      ctx.restore();
      x += pw + 16;
    });
    wipe(ctx, w, h, t, duration);
  },
};
