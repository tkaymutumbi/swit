// Hook: three pains slide away, then the question lands. Icon top right (comment cmuyibxou78).
import { C, SANS, background, finish, hud, wipe, words, gradText, icon, spark, spring, eo3, eio, clamp, mix } from './_kit.js';

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt);

    // slow push-in on the content
    ctx.save();
    const z = 1 + 0.045 * (t / duration);
    ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    const lines = ['Videos take an editor,', 'a timeline,', 'and a free weekend.'];
    const out = eio((t - 2.15) / 0.6);
    lines.forEach((l, i) => {
      words(ctx, l, 220, 410 + i * 130, t, 0.2 + i * 0.5, { size: 104, weight: 600, gap: 0.09, dur: 0.75, out, dy: -70 * out, color: i === 2 ? C.c : C.t });
    });
    // thin rule that draws under the lines
    const rule = eio((t - 0.2) / 1.6) * (1 - out);
    ctx.fillStyle = 'rgba(143,180,255,0.5)'; ctx.fillRect(220, 330, 520 * rule, 3);

    // the question
    const q = clamp((t - 2.7) / 0.9);
    const sc = mix(1.18, 1, eo3(q));
    gradText(ctx, 'What if Claude just wrote it?', w / 2, 585, { size: 112, align: 'center', p: q, scale: sc, glow: 'rgba(120,150,255,0.55)' });
    const ur = eio((t - 3.0) / 0.7);
    const g = ctx.createLinearGradient(w / 2 - 420, 0, w / 2 + 420, 0); g.addColorStop(0, C.c); g.addColorStop(1, C.c2);
    ctx.fillStyle = g; ctx.fillRect(w / 2 - 420 * ur, 640, 840 * ur, 4);
    if (q > 0.2) { spark(ctx, w / 2 + 640, 500, 26 * q, gt * 0.8, C.c, q); spark(ctx, w / 2 - 650, 650, 18 * q, -gt, C.c2, q * 0.8); }

    // app icon (top right)
    const ik = spring((t - 0.2) / 0.8);
    const s = 180 * ik;
    icon(ctx, 1691 - s / 2, 243 - s / 2, s, clamp(ik), 0.7 + 0.3 * Math.sin(gt * 2));
    ctx.restore();

    wipe(ctx, w, h, t, duration);
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
