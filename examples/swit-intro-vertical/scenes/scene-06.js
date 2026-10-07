// End card (vertical): icon, wordmark, tagline over two lines, repo link, fade out.
import { C, SANS, MONO, background, wipe, words, chars, icon, spring, eio, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration, safe }) {
    background(ctx, w, h);
    const cx = w / 2;

    const ik = spring((t - 0.4) / 0.7), s = 260 * ik;
    icon(ctx, cx - s / 2, 520 + (260 - s) / 2, s, clamp(ik));
    chars(ctx, 'Swit', cx, 1020, t, 0.9, { size: 220, align: 'center', gap: 0.07 });
    words(ctx, 'Video as code.', cx, 1130, t, 1.6, { size: 64, weight: 400, color: C.s, align: 'center', gap: 0.07 });
    words(ctx, 'Reviewed by you.', cx, 1210, t, 1.85, { size: 64, weight: 400, color: C.s, align: 'center', gap: 0.07 });

    const lk = clamp((t - 2.4) / 0.6), txt = 'github.com/tkaymutumbi/swit';
    ctx.save(); ctx.font = `500 36px ${MONO}`; const tw = ctx.measureText(txt).width; ctx.restore();
    ctx.save(); ctx.globalAlpha = lk; ctx.font = `500 36px ${MONO}`; ctx.fillStyle = C.c; ctx.textAlign = 'center'; ctx.fillText(txt, cx, 1340 + (1 - lk) * 14); ctx.restore();
    const ur = eio((t - 2.8) / 0.7);
    ctx.fillStyle = C.c; ctx.globalAlpha = 0.6; ctx.fillRect(cx - tw / 2, 1360, tw * ur, 2); ctx.globalAlpha = 1;

    const fo = eio((t - (duration - 1.0)) / 1.0);
    if (fo > 0) { ctx.save(); ctx.globalAlpha = fo; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    wipe(ctx, w, h, t, duration, { inT: 0 });
  },
};
