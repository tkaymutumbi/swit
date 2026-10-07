// Hook: three pains slide away, then the question. Icon top right (comment cmuyibxou78).
import { C, background, wipe, words, icon, spring, eio, clamp } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration }) {
    background(ctx, w, h);

    const out = eio((t - 2.2) / 0.5);
    ['Videos take an editor,', 'a timeline,', 'and a free weekend.'].forEach((l, i) => {
      words(ctx, l, 160, 440 + i * 140, t, 0.2 + i * 0.5, { size: 112, weight: 600, gap: 0.08, out, dy: -40 * out });
    });

    // the question, left aligned, with one word in the accent
    const q = (str, y, t0, accentWord) => words(ctx, str, 160, y, t, t0, { size: 156, weight: 700, gap: 0.09, dur: 0.7, color: (wd) => (wd === accentWord ? C.c : C.t) });
    q('What if Claude', 540, 2.7, 'Claude');
    q('just wrote it?', 705, 3.0);

    // app icon, top right
    const ik = spring((t - 0.2) / 0.7), s = 180 * ik;
    icon(ctx, 1691 - s / 2, 243 - s / 2, s, clamp(ik));

    wipe(ctx, w, h, t, duration);
  },
};
