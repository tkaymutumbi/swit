// End card: icon, wordmark, tagline, repo link. Fades out.
import { C, SANS, MONO, background, wipe, words, chars, icon, spring, eio, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration }) {
    background(ctx, w, h);

    const cx = w / 2, ik = spring((t - 0.4) / 0.7), s = 220 * ik;
    icon(ctx, cx - s / 2, 250 + (220 - s) / 2, s, clamp(ik));
    chars(ctx, 'Swit', cx, 680, t, 0.9, { size: 170, align: 'center', gap: 0.07 });
    words(ctx, 'Video as code. Reviewed by you.', cx, 770, t, 1.6, { size: 56, weight: 400, color: C.s, align: 'center', gap: 0.07 });

    // repo link with a hairline under it
    const lk = clamp((t - 2.4) / 0.6), txt = 'github.com/tkaymutumbi/swit';
    ctx.save(); ctx.font = `500 42px ${MONO}`; const tw = ctx.measureText(txt).width; ctx.restore();
    ctx.save(); ctx.globalAlpha = lk; ctx.font = `500 42px ${MONO}`; ctx.fillStyle = C.c; ctx.textAlign = 'center'; ctx.fillText(txt, cx, 875 + (1 - lk) * 14); ctx.restore();
    const ur = eio((t - 2.8) / 0.7);
    ctx.fillStyle = C.c; ctx.globalAlpha = 0.6; ctx.fillRect(cx - tw / 2, 895, tw * ur, 2); ctx.globalAlpha = 1;

    const fo = eio((t - (duration - 1.0)) / 1.0);
    if (fo > 0) { ctx.save(); ctx.globalAlpha = fo; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    wipe(ctx, w, h, t, duration, { inT: 0 });
  },
};
