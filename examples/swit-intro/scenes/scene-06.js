// End card: aurora opens, icon bursts in, wordmark, tagline, repo pill with a light sweep, fade to dark.
import { C, SANS, MONO, background, finish, hud, wipe, words, chars, glass, icon, spark, spring, eo3, eio, clamp, mix } from './_kit.js';

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt, { glow: 1.5 });
    // wipe off the previous scene
    ctx.save();
    const z = 1.03 - 0.03 * eio(t / duration); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    const cx = w / 2, cy = 360, ik = spring((t - 0.4) / 0.9), s = 250 * ik;
    // ring burst
    for (let i = 0; i < 2; i++) { const p = (t - 0.55 - i * 0.18) / 1.1; if (p > 0 && p < 1) { ctx.save(); ctx.strokeStyle = `rgba(143,180,255,${0.55 * (1 - p)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 130 + 520 * eo3(p), 0, 7); ctx.stroke(); ctx.restore(); } }
    icon(ctx, cx - s / 2, cy - s / 2, s, clamp(ik), 1);
    for (let i = 0; i < 4; i++) { const a = gt * 0.7 + i * 1.571, r = 230 + 10 * Math.sin(gt * 2 + i); spark(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 10 + 4 * (i % 2), a * 2, i % 2 ? C.c2 : C.c, 0.8 * clamp(ik)); }

    chars(ctx, 'Swit', cx, 640, t, 0.9, { size: 156, align: 'center', gap: 0.08, glow: 'rgba(120,150,255,0.4)' });
    words(ctx, 'Video as code. Reviewed by you.', cx, 726, t, 1.6, { size: 56, weight: 400, color: C.s, align: 'center', gap: 0.07 });

    // repo pill with a light sweep
    const lk = spring((t - 2.4) / 0.7), a = clamp(lk), txt = 'github.com/tkaymutumbi/swit';
    ctx.save(); ctx.font = `500 40px ${MONO}`; const tw = ctx.measureText(txt).width; ctx.restore();
    const pw = tw + 120, px = cx - pw / 2, py = 790, ph = 96, sc = 0.8 + 0.2 * lk;
    ctx.save(); ctx.translate(cx, py + ph / 2); ctx.scale(sc, sc); ctx.translate(-cx, -(py + ph / 2));
    glass(ctx, px, py, pw, ph, 48, { alpha: a, glow: 'rgba(110,140,255,0.35)' });
    ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 48); ctx.clip();
    const sw = eio((t - 3.0) / 1.0), sx = mix(px - 200, px + pw + 100, sw);
    const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(190,210,255,0.28)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(px, py, pw, ph); ctx.restore();
    ctx.globalAlpha = a; ctx.fillStyle = C.c; ctx.font = `500 40px ${MONO}`; ctx.fillText(txt, px + 60, py + 62);
    ctx.restore();
    ctx.restore();

    // fade to near black at the very end
    const fo = eio((t - (duration - 1.0)) / 1.0);
    if (fo > 0) { ctx.save(); ctx.globalAlpha = fo * 0.92; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    wipe(ctx, w, h, t, duration, { inT: 0 });
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
