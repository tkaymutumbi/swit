// Ask: a typed request in a terminal window, then Claude's questions as pills.
import { C, SANS, MONO, background, finish, hud, wipe, words, glass, spark, spring, eo3, eio, clamp, mix } from './_kit.js';

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt);
    ctx.save();
    const z = 1 + 0.035 * (t / duration); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    words(ctx, 'Ask for a video.', 240, 200, t, 0.1, { size: 86, weight: 700 });
    words(ctx, 'Claude asks a few questions first.', 240, 280, t, 0.5, { size: 46, weight: 400, color: C.s, gap: 0.05 });

    // terminal window
    const wk = eo3((t - 0.3) / 0.7), wy = 350 + (1 - wk) * 40;
    glass(ctx, 240, wy, 1440, 250, 28, { alpha: wk, glow: 'rgba(90,120,255,0.18)' });
    ctx.save(); ctx.globalAlpha = wk;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#3a4150', '#3a4150', '#3a4150'][i]; ctx.beginPath(); ctx.arc(284 + i * 30, wy + 40, 8, 0, 7); ctx.fill(); }
    ctx.fillStyle = C.s; ctx.font = `400 22px ${MONO}`; ctx.fillText('claude', 1560, wy + 47);
    ctx.restore();
    const msg = 'create a pro video that explains my product';
    const n = Math.floor(msg.length * clamp((t - 0.9) / 1.5));
    ctx.save(); ctx.globalAlpha = wk; ctx.font = `500 46px ${MONO}`; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.c; ctx.fillText('>', 290, wy + 165);
    ctx.fillStyle = C.t; const typed = msg.slice(0, n); ctx.fillText(typed, 350, wy + 165);
    const cx = 350 + ctx.measureText(typed).width;
    if (n < msg.length || Math.floor(t * 2.4) % 2 === 0) { ctx.shadowColor = C.c; ctx.shadowBlur = 20; ctx.fillStyle = C.c; ctx.fillRect(cx + 4, wy + 124, 5, 54); }
    ctx.restore();

    // Claude's reply
    const rk = eo3((t - 2.55) / 0.7), ry = 640 + (1 - rk) * 50;
    glass(ctx, 240, ry, 1440, 305, 28, { alpha: rk });
    spark(ctx, 296, ry + 56, 20 * rk, gt * 1.5, C.c2, rk);
    words(ctx, 'Quick questions first', 340, ry + 70, t, 2.7, { size: 40, weight: 600, gap: 0.08 });
    const qs = [['Length', '30s'], ['Audience', 'developers'], ['Style', 'dark and blue'], ['Ending', 'GitHub link']];
    let x = 290, y = ry + 112;
    qs.forEach(([a, b], i) => {
      const k = spring((t - 3.1 - i * 0.3) / 0.6), al = clamp(k);
      ctx.save(); ctx.font = `400 32px ${SANS}`; const wa = ctx.measureText(a + '  ').width; ctx.font = `600 32px ${SANS}`; const wb = ctx.measureText(b).width; ctx.restore();
      const pw = wa + wb + 60, ph = 68;
      if (x + pw > 1640) { x = 290; y += 86; }
      ctx.save(); const sc = 0.8 + 0.2 * k; ctx.translate(x + pw / 2, y + ph / 2); ctx.scale(sc, sc); ctx.translate(-(x + pw / 2), -(y + ph / 2));
      ctx.globalAlpha = al; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 34); ctx.fillStyle = 'rgba(143,180,255,0.10)'; ctx.fill(); ctx.strokeStyle = 'rgba(143,180,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = `400 32px ${SANS}`; ctx.fillStyle = C.s; ctx.fillText(a, x + 30, y + 45);
      ctx.font = `600 32px ${SANS}`; ctx.fillStyle = C.c; ctx.fillText(b, x + 30 + wa, y + 45);
      ctx.restore();
      x += pw + 18;
    });
    ctx.restore();
    wipe(ctx, w, h, t, duration);
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
