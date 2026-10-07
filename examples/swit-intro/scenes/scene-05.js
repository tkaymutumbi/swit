// Review: box annotation + comment, cursor asks Claude to fix, code edit strip, logo grows, comment resolves.
import { C, SANS, MONO, background, finish, hud, wipe, words, glass, cursor, ripple, spark, spring, eo3, eio, clamp, mix, rng } from './_kit.js';

export default {
  draw(ctx, t, { w, h, gt, total, duration }) {
    background(ctx, w, h, gt);
    ctx.save();
    const z = 1 + 0.03 * (t / duration); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

    words(ctx, 'Comment on the video, or the code.', 240, 190, t, 0.1, { size: 78, weight: 700 });
    words(ctx, 'Then Claude fixes what you wrote.', 240, 262, t, 0.55, { size: 44, weight: 400, color: C.s, gap: 0.05 });

    // window
    const wk = eo3((t - 0.3) / 0.7), wx = 200, wy = 320 + (1 - wk) * 40, ww = 1520, wh = 640;
    glass(ctx, wx, wy, ww, wh, 28, { alpha: wk, glow: 'rgba(90,120,255,0.16)' });
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.s; ctx.font = `500 24px ${SANS}`; ctx.fillText('Review', wx + 40, wy + 42);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#3a4150'; ctx.beginPath(); ctx.arc(wx + ww - 100 + i * 28, wy + 34, 8, 0, 7); ctx.fill(); } ctx.restore();

    // video frame
    const vx = wx + 32, vy = wy + 64, vw = 960, vh = 540;
    ctx.save(); ctx.globalAlpha = wk; ctx.beginPath(); ctx.roundRect(vx, vy, vw, vh, 16); ctx.clip();
    const g = ctx.createLinearGradient(vx, vy, vx + vw, vy + vh); g.addColorStop(0, '#f6c07a'); g.addColorStop(1, '#d9722f'); ctx.fillStyle = g; ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = 'rgba(255,244,220,0.9)'; ctx.shadowColor = '#fff2c8'; ctx.shadowBlur = 60; ctx.beginPath(); ctx.arc(vx + vw * 0.78, vy + vh * 0.7, 80, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ctx.font = `700 80px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Mornings, sorted.', vx + vw / 2, vy + vh / 2 + 30); ctx.textAlign = 'left';
    // logo tile: grows after the fix
    const grow = spring((t - 4.3) / 0.8), ls = mix(64, 128, clamp(grow, 0, 1.2));
    ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.beginPath(); ctx.roundRect(vx + 36, vy + 36, ls, ls, ls * 0.24); ctx.fill();
    ctx.fillStyle = '#d9722f'; ctx.font = `700 ${ls * 0.5}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('B', vx + 36 + ls / 2, vy + 36 + ls / 2 + ls * 0.17); ctx.textAlign = 'left';
    // claude edit strip
    const sk = eo3((t - 3.95) / 0.5) * (1 - eo3((t - 5.2) / 0.5));
    if (sk > 0) {
      ctx.globalAlpha = sk; ctx.beginPath(); ctx.roundRect(vx + 140, vy + vh - 110 + (1 - sk) * 30, vw - 280, 74, 18); ctx.fillStyle = 'rgba(10,12,17,0.88)'; ctx.fill();
      ctx.strokeStyle = 'rgba(143,180,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.c2; ctx.font = `500 26px ${MONO}`; ctx.fillText('scene-01.js', vx + 172, vy + vh - 62 + (1 - sk) * 30);
      ctx.fillStyle = C.s; ctx.fillText('logo w:', vx + 400, vy + vh - 62 + (1 - sk) * 30);
      ctx.fillStyle = '#ff9a9a'; ctx.fillText('120', vx + 536, vy + vh - 62 + (1 - sk) * 30);
      ctx.fillStyle = C.s; ctx.fillText('->', vx + 604, vy + vh - 62 + (1 - sk) * 30);
      ctx.fillStyle = C.ok; ctx.fillText('240', vx + 664, vy + vh - 62 + (1 - sk) * 30);
    }
    ctx.restore();

    // box annotation with corner handles
    const bx = vx + 18, by = vy + 18, bw = 108, bh = 108, per = 2 * (bw + bh);
    const bk = eio((t - 0.9) / 0.8), boxA = 1 - eo3((t - 4.5) / 0.4);
    ctx.save(); ctx.globalAlpha = boxA * wk; ctx.strokeStyle = C.c; ctx.lineWidth = 5; ctx.shadowColor = C.c; ctx.shadowBlur = 24; ctx.setLineDash([per, per]); ctx.lineDashOffset = per * (1 - bk);
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.stroke(); ctx.setLineDash([]);
    if (bk > 0.95) { ctx.fillStyle = '#fff'; for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) ctx.fillRect(hx - 6, hy - 6, 12, 12); }
    ctx.restore();
    const pk = spring((t - 1.6) / 0.5) * boxA;
    if (pk > 0) { ctx.save(); ctx.fillStyle = C.c; ctx.shadowColor = C.c; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(bx + bw + 6, by - 4, 24 * pk, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = boxA; ctx.fillStyle = C.ci; ctx.font = `700 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('1', bx + bw + 6, by + 6); ctx.restore(); }

    // comments panel
    const px = vx + vw + 32, py = wy + 64, pw = ww - (px - wx) - 32, ph = 540;
    ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = C.t; ctx.font = `600 30px ${SANS}`; ctx.fillText('Comments', px + 6, py + 34); ctx.restore();
    const ck = eo3((t - 1.7) / 0.6), resolved = eo3((t - 4.7) / 0.5);
    const cy = py + 64 + (1 - ck) * 24;
    ctx.save(); ctx.globalAlpha = ck;
    ctx.beginPath(); ctx.roundRect(px, cy, pw, 230, 18); ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fill();
    ctx.strokeStyle = resolved > 0.5 ? C.ok : 'rgba(160,185,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
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
    const kk = eo3((t - 3.0) / 0.5), press = t > 3.75 && t < 3.9 ? 0.96 : 1, by2 = py + ph - 86;
    ctx.save(); ctx.globalAlpha = kk * wk; ctx.translate(px + pw / 2, by2 + 38); ctx.scale(press, press); ctx.translate(-(px + pw / 2), -(by2 + 38));
    ctx.beginPath(); ctx.roundRect(px, by2, pw, 76, 18);
    if (resolved > 0.5) { ctx.fillStyle = 'rgba(111,227,160,0.12)'; ctx.fill(); ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.stroke(); }
    else { const bg = ctx.createLinearGradient(px, 0, px + pw, 0); bg.addColorStop(0, '#7ea3ff'); bg.addColorStop(1, '#a98bff'); ctx.shadowColor = 'rgba(120,150,255,0.6)'; ctx.shadowBlur = 36; ctx.fillStyle = bg; ctx.fill(); }
    ctx.shadowColor = 'transparent'; ctx.fillStyle = resolved > 0.5 ? C.ok : C.ci; ctx.font = `700 28px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(resolved > 0.5 ? 'Resolved' : 'Ask Claude to fix 1', px + pw / 2, by2 + 49); ctx.textAlign = 'left';
    ctx.restore();
    const cp2 = eio((t - 3.05) / 0.7);
    if (t > 2.9 && t < 5.3) cursor(ctx, mix(px + pw + 80, px + pw * 0.6, cp2), mix(py + 120, by2 + 30, cp2), 1.05, clamp((t - 2.9) / 0.25) * (1 - clamp((t - 4.9) / 0.4)));
    ripple(ctx, px + pw * 0.6, by2 + 30, (t - 3.78) / 0.55);

    // burst when the logo grows
    const bp = (t - 4.35) / 0.8;
    if (bp > 0 && bp < 1) { const r = rng(5); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const a = r() * 6.283, d = (40 + r() * 130) * eo3(bp); ctx.fillStyle = `rgba(255,236,200,${(1 - bp) * 0.9})`; ctx.beginPath(); ctx.arc(vx + 36 + 64 + Math.cos(a) * d, vy + 36 + 64 + Math.sin(a) * d, 4 * (1 - bp) + 1, 0, 7); ctx.fill(); }
      ctx.restore(); }
    ctx.restore();

    wipe(ctx, w, h, t, duration);
    finish(ctx, w, h, gt);
    hud(ctx, w, h, gt, total);
  },
};
