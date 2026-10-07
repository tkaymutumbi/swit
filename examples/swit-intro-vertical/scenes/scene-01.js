// Hook (vertical): pain lines stack, then the question. Laid out inside the safe area (x 76..930, y 172..1536).
import { C, background, wipe, words, icon, spring, eio, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration, safe }) {
    background(ctx, w, h);
    const X = safe.x;

    const out = eio((t - 2.2) / 0.5);
    ['Videos take', 'an editor,', 'a timeline,', 'and a free', 'weekend.'].forEach((l, i) => {
      words(ctx, l, X, 620 + i * 140, t, 0.2 + i * 0.4, { size: 124, weight: 600, gap: 0.08, out, dy: -40 * out });
    });

    const q = (str, y, t0, accent) => words(ctx, str, X, y, t, t0, { size: 176, weight: 700, gap: 0.09, dur: 0.7, color: (wd) => (wd === accent ? C.c : C.t) });
    q('What if', 600, 2.7);
    q('Claude', 790, 2.85, 'Claude');
    q('just wrote', 980, 3.0);
    q('it?', 1170, 3.15);

    // app icon, top right of the safe area
    const ik = spring((t - 0.2) / 0.7), s = 150 * ik, cx = safe.x + safe.w - 75, cy = safe.y + 100;
    icon(ctx, cx - s / 2, cy - s / 2, s, clamp(ik));

    wipe(ctx, w, h, t, duration);
  },
};
