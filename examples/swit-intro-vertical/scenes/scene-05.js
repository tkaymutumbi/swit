// Review (vertical): a vertical frame with a box annotation, a comment, the fix, resolved.
import { C, SANS, MONO, background, wipe, words, panel, rr, cursor, ripple, spring, eo3, eio, clamp, mix } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration, safe }) {
    background(ctx, w, h);
    const X = safe.x, W = safe.w;

    words(ctx, 'Comment on the', X, 330, t, 0.1, { size: 104, weight: 700 });
    words(ctx, 'video, or the code.', X, 440, t, 0.25, { size: 104, weight: 700 });
    words(ctx, 'Then Claude fixes', X, 530, t, 0.55, { size: 46, weight: 400, color: C.s, gap: 0.05 });
    words(ctx, 'what you wrote.', X, 590, t, 0.75, { size: 46, weight: 400, color: C.s, gap: 0.05 });

    // window
    const wk = eo3((t - 0.3) / 0.6), wx = X, wy = 700 + (1 - wk) * 24, ww = W, wh = 640;
    panel(ctx, wx, wy, ww, wh, 18, { alpha: wk });
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.s; ctx.font = `500 22px ${SANS}`; ctx.fillText('Review', wx + 24, wy + 38); ctx.restore();

    // vertical video frame
    const vw = 310, vh = vw * 16 / 9, vx = wx + 24, vy = wy + 58;
    ctx.save(); ctx.globalAlpha = wk; ctx.beginPath(); ctx.roundRect(vx, vy, vw, vh, 12); ctx.clip();
    ctx.fillStyle = '#e8924a'; ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = '#f7e6c4'; ctx.beginPath(); ctx.arc(vx + vw * 0.5, vy + vh * 0.82, 62, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 46px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Mornings,', vx + vw / 2, vy + vh * 0.46); ctx.fillText('sorted.', vx + vw / 2, vy + vh * 0.46 + 54); ctx.textAlign = 'left';
    // logo tile grows after the fix
    const grow = spring((t - 4.3) / 0.7), ls = mix(48, 96, clamp(grow, 0, 1.15));
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(vx + 24, vy + 24, ls, ls, ls * 0.24); ctx.fill();
    ctx.fillStyle = '#d9722f'; ctx.font = `700 ${ls * 0.5}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('B', vx + 24 + ls / 2, vy + 24 + ls / 2 + ls * 0.17); ctx.textAlign = 'left';
    // claude edit strip
    const sk = eo3((t - 3.95) / 0.4) * (1 - eo3((t - 5.2) / 0.4));
    if (sk > 0) {
      ctx.globalAlpha = sk; const sy = vy + vh - 96 + (1 - sk) * 20;
      rr(ctx, vx + 16, sy, vw - 32, 56, 12, { fill: '#0d0e10', stroke: '#343941', lw: 1.5 });
      ctx.font = `500 19px ${MONO}`; ctx.fillStyle = C.s; ctx.fillText('logo w:', vx + 32, sy + 35);
      ctx.fillStyle = '#f0928c'; ctx.fillText('120', vx + 120, sy + 35);
      ctx.fillStyle = C.s; ctx.fillText('->', vx + 164, sy + 35);
      ctx.fillStyle = C.ok; ctx.fillText('240', vx + 206, sy + 35);
    }
    ctx.restore();

    // box annotation
    const bx = vx + 12, by = vy + 12, bw = 72, bh = 72, per = 2 * (bw + bh);
    const bk = eio((t - 0.9) / 0.8), boxA = 1 - eo3((t - 4.5) / 0.4);
    ctx.save(); ctx.globalAlpha = boxA * wk; ctx.strokeStyle = C.c; ctx.lineWidth = 4; ctx.setLineDash([per, per]); ctx.lineDashOffset = per * (1 - bk);
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.stroke(); ctx.setLineDash([]);
    if (bk > 0.95) { ctx.fillStyle = '#fff'; for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) ctx.fillRect(hx - 5, hy - 5, 10, 10); }
    ctx.restore();
    const pk = spring((t - 1.6) / 0.45) * boxA;
    if (pk > 0) { ctx.save(); ctx.fillStyle = C.c; ctx.beginPath(); ctx.arc(bx + bw + 4, by - 2, 20 * pk, 0, 7); ctx.fill();
      ctx.globalAlpha = clamp(boxA); ctx.fillStyle = C.ci; ctx.font = `700 22px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('1', bx + bw + 4, by + 6); ctx.restore(); }

    // comments panel
    const px = vx + vw + 24, py = vy, pw = wx + ww - 24 - px, ph = vh;
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.t; ctx.font = `600 28px ${SANS}`; ctx.fillText('Comments', px + 2, py + 28); ctx.restore();
    const ck = eo3((t - 1.7) / 0.5), resolved = eo3((t - 4.7) / 0.4);
    const cy = py + 56 + (1 - ck) * 18;
    ctx.save(); ctx.globalAlpha = ck;
    rr(ctx, px, cy, pw, 250, 14, { fill: C.bg, stroke: resolved > 0.5 ? C.ok : C.l, lw: 1.5 });
    ctx.fillStyle = resolved > 0.5 ? C.ok : C.c; ctx.beginPath(); ctx.arc(px + 36, cy + 38, 16, 0, 7); ctx.fill();
    if (resolved > 0.5) { const cp = clamp((t - 4.85) / 0.3); ctx.strokeStyle = C.ci; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(px + 28, cy + 38); ctx.lineTo(px + 34, cy + 45); if (cp > 0.4) ctx.lineTo(px + 46, cy + 31); ctx.stroke(); }
    else { ctx.fillStyle = C.ci; ctx.font = `700 20px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('1', px + 36, cy + 45); ctx.textAlign = 'left'; }
    ctx.fillStyle = C.c; ctx.font = `500 22px ${MONO}`; ctx.fillText('0:04', px + 64, cy + 45);
    const l1 = 'Logo is too small.', l2 = 'Double it.', n = Math.floor((l1.length + l2.length) * clamp((t - 2.1) / 0.9));
    ctx.fillStyle = C.t; ctx.font = `400 28px ${SANS}`;
    ctx.fillText(l1.slice(0, n), px + 24, cy + 104); if (n > l1.length) ctx.fillText(l2.slice(0, n - l1.length), px + 24, cy + 144);
    ctx.globalAlpha = ck * resolved; ctx.fillStyle = C.ok; ctx.font = `500 22px ${SANS}`; ctx.fillText('Claude: logo doubled', px + 24, cy + 214);
    ctx.restore();

    // ask Claude button + cursor
    const kk = eo3((t - 3.0) / 0.4), press = t > 3.75 && t < 3.9 ? 0.97 : 1, by2 = py + ph - 76;
    ctx.save(); ctx.globalAlpha = kk * wk; ctx.translate(px + pw / 2, by2 + 34); ctx.scale(press, press); ctx.translate(-(px + pw / 2), -(by2 + 34));
    if (resolved > 0.5) rr(ctx, px, by2, pw, 68, 14, { stroke: C.ok, lw: 2 }); else rr(ctx, px, by2, pw, 68, 14, { fill: C.c });
    ctx.fillStyle = resolved > 0.5 ? C.ok : C.ci; ctx.font = `700 24px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(resolved > 0.5 ? 'Resolved' : 'Ask Claude to fix 1', px + pw / 2, by2 + 43); ctx.textAlign = 'left';
    ctx.restore();
    const cp2 = eio((t - 3.05) / 0.7);
    if (t > 2.9 && t < 5.3) cursor(ctx, mix(px + pw + 40, px + pw * 0.6, cp2), mix(py + 150, by2 + 26, cp2), 1.0, clamp((t - 2.9) / 0.25) * (1 - clamp((t - 4.9) / 0.4)));
    ripple(ctx, px + pw * 0.6, by2 + 26, (t - 3.78) / 0.55);

    wipe(ctx, w, h, t, duration);
  },
};
