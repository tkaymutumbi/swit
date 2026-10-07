// Review: box annotation + comment, cursor asks Claude to fix, code edit strip, logo grows, comment resolves.
import { C, SANS, MONO, background, wipe, words, panel, rr, cursor, ripple, spring, eo3, eio, clamp, mix } from './_kit.js';

export default {
  draw(ctx, t, { w, h, duration }) {
    background(ctx, w, h);

    words(ctx, 'Comment on the video, or the code.', 160, 195, t, 0.1, { size: 88, weight: 700 });
    words(ctx, 'Then Claude fixes what you wrote.', 160, 265, t, 0.55, { size: 44, weight: 400, color: C.s, gap: 0.05 });

    // window
    const wk = eo3((t - 0.3) / 0.6), wx = 160, wy = 320 + (1 - wk) * 24, ww = 1600, wh = 640;
    panel(ctx, wx, wy, ww, wh, 18, { alpha: wk });
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.s; ctx.font = `500 24px ${SANS}`; ctx.fillText('Review', wx + 32, wy + 40); ctx.restore();

    // video frame
    const vx = wx + 30, vy = wy + 64, vw = 960, vh = 540;
    ctx.save(); ctx.globalAlpha = wk; ctx.beginPath(); ctx.roundRect(vx, vy, vw, vh, 12); ctx.clip();
    ctx.fillStyle = '#e8924a'; ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = '#f7e6c4'; ctx.beginPath(); ctx.arc(vx + vw * 0.78, vy + vh * 0.7, 80, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 80px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Mornings, sorted.', vx + vw / 2, vy + vh / 2 + 30); ctx.textAlign = 'left';
    // logo tile grows after the fix
    const grow = spring((t - 4.3) / 0.7), ls = mix(64, 128, clamp(grow, 0, 1.15));
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(vx + 36, vy + 36, ls, ls, ls * 0.24); ctx.fill();
    ctx.fillStyle = '#d9722f'; ctx.font = `700 ${ls * 0.5}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('B', vx + 36 + ls / 2, vy + 36 + ls / 2 + ls * 0.17); ctx.textAlign = 'left';
    // claude edit strip
    const sk = eo3((t - 3.95) / 0.4) * (1 - eo3((t - 5.2) / 0.4));
    if (sk > 0) {
      ctx.globalAlpha = sk; const sy = vy + vh - 110 + (1 - sk) * 24;
      rr(ctx, vx + 140, sy, vw - 280, 74, 14, { fill: '#0d0e10', stroke: '#343941', lw: 1.5 });
      ctx.fillStyle = C.c; ctx.font = `500 26px ${MONO}`; ctx.fillText('scene-01.js', vx + 172, sy + 47);
      ctx.fillStyle = C.s; ctx.fillText('logo w:', vx + 400, sy + 47);
      ctx.fillStyle = '#f0928c'; ctx.fillText('120', vx + 536, sy + 47);
      ctx.fillStyle = C.s; ctx.fillText('->', vx + 604, sy + 47);
      ctx.fillStyle = C.ok; ctx.fillText('240', vx + 664, sy + 47);
    }
    ctx.restore();

    // box annotation
    const bx = vx + 18, by = vy + 18, bw = 108, bh = 108, per = 2 * (bw + bh);
    const bk = eio((t - 0.9) / 0.8), boxA = 1 - eo3((t - 4.5) / 0.4);
    ctx.save(); ctx.globalAlpha = boxA * wk; ctx.strokeStyle = C.c; ctx.lineWidth = 5; ctx.setLineDash([per, per]); ctx.lineDashOffset = per * (1 - bk);
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.stroke(); ctx.setLineDash([]);
    if (bk > 0.95) { ctx.fillStyle = '#fff'; for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) ctx.fillRect(hx - 6, hy - 6, 12, 12); }
    ctx.restore();
    const pk = spring((t - 1.6) / 0.45) * boxA;
    if (pk > 0) { ctx.save(); ctx.fillStyle = C.c; ctx.beginPath(); ctx.arc(bx + bw + 6, by - 4, 24 * pk, 0, 7); ctx.fill();
      ctx.globalAlpha = clamp(boxA); ctx.fillStyle = C.ci; ctx.font = `700 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('1', bx + bw + 6, by + 6); ctx.restore(); }

    // comments panel
    const px = vx + vw + 30, py = wy + 64, pw = wx + ww - 30 - px, ph = 540;
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.t; ctx.font = `600 30px ${SANS}`; ctx.fillText('Comments', px + 4, py + 34); ctx.restore();
    const ck = eo3((t - 1.7) / 0.5), resolved = eo3((t - 4.7) / 0.4);
    const cy = py + 64 + (1 - ck) * 18;
    ctx.save(); ctx.globalAlpha = ck;
    rr(ctx, px, cy, pw, 230, 14, { fill: C.bg, stroke: resolved > 0.5 ? C.ok : C.l, lw: 1.5 });
    ctx.fillStyle = resolved > 0.5 ? C.ok : C.c; ctx.beginPath(); ctx.arc(px + 40, cy + 40, 18, 0, 7); ctx.fill();
    if (resolved > 0.5) { const cp = clamp((t - 4.85) / 0.3); ctx.strokeStyle = C.ci; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(px + 31, cy + 40); ctx.lineTo(px + 38, cy + 48); if (cp > 0.4) ctx.lineTo(px + 51, cy + 32); ctx.stroke(); }
    else { ctx.fillStyle = C.ci; ctx.font = `700 22px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('1', px + 40, cy + 48); ctx.textAlign = 'left'; }
    ctx.fillStyle = C.c; ctx.font = `500 24px ${MONO}`; ctx.fillText('0:04', px + 72, cy + 48);
    const txt = 'Logo is too small. Double it.', n = Math.floor(txt.length * clamp((t - 2.1) / 0.9));
    ctx.fillStyle = C.t; ctx.font = `400 28px ${SANS}`;
    const shown = txt.slice(0, n), brk = shown.indexOf('. ') >= 0 ? shown.indexOf('. ') + 1 : shown.length;
    ctx.fillText(shown.slice(0, brk), px + 28, cy + 110); if (shown.length > brk) ctx.fillText(shown.slice(brk + 1), px + 28, cy + 150);
    ctx.globalAlpha = ck * resolved; ctx.fillStyle = C.ok; ctx.font = `500 24px ${SANS}`; ctx.fillText('Claude: logo doubled', px + 28, cy + 202);
    ctx.restore();

    // ask Claude button + cursor
    const kk = eo3((t - 3.0) / 0.4), press = t > 3.75 && t < 3.9 ? 0.97 : 1, by2 = py + ph - 86;
    ctx.save(); ctx.globalAlpha = kk * wk; ctx.translate(px + pw / 2, by2 + 38); ctx.scale(press, press); ctx.translate(-(px + pw / 2), -(by2 + 38));
    if (resolved > 0.5) rr(ctx, px, by2, pw, 76, 14, { stroke: C.ok, lw: 2 }); else rr(ctx, px, by2, pw, 76, 14, { fill: C.c });
    ctx.fillStyle = resolved > 0.5 ? C.ok : C.ci; ctx.font = `700 28px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(resolved > 0.5 ? 'Resolved' : 'Ask Claude to fix 1', px + pw / 2, by2 + 49); ctx.textAlign = 'left';
    ctx.restore();
    const cp2 = eio((t - 3.05) / 0.7);
    if (t > 2.9 && t < 5.3) cursor(ctx, mix(px + pw + 80, px + pw * 0.6, cp2), mix(py + 120, by2 + 30, cp2), 1.05, clamp((t - 2.9) / 0.25) * (1 - clamp((t - 4.9) / 0.4)));
    ripple(ctx, px + pw * 0.6, by2 + 30, (t - 3.78) / 0.55);

    wipe(ctx, w, h, t, duration);
  },
};
