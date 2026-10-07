// Renders a Swit project folder: scenes/*.js (canvas modules) -> frames/*.png and video.mp4.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.SWIT_CHROME || '/usr/bin/chromium';
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<canvas id="c"></canvas>
<script type="module">
import { helpers } from '/__swit/helpers.js';
const sb = await (await fetch('/storyboard.json')).json();
const formats = await (await fetch('/__swit/formats.json')).json();
const W = sb.width || 1920, H = sb.height || 1080;
const fmt = formats.find((f) => f.id === sb.format) || formats.find((f) => f.width === W && f.height === H) || formats[0];
// u: scale unit (1 at 1080 on the short side). vertical: taller than wide. safe: content box that stays clear of platform UI.
const u = Math.min(W, H) / 1080, vertical = H > W;
const safe = { x: Math.round(fmt.safe.left * W), y: Math.round(fmt.safe.top * H), w: Math.round(W * (1 - fmt.safe.left - fmt.safe.right)), h: Math.round(H * (1 - fmt.safe.top - fmt.safe.bottom)) };
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
const scenes = [];
const starts = []; let total = 0;
for (const s of sb.scenes) { starts.push(total); total += s.duration; }
for (const s of sb.scenes) scenes.push((await import('/' + s.file + '?v=' + Date.now())).default);
if (document.fonts) await document.fonts.ready;
window.__ready = true;
window.__info = { W, H };
// Draw scene i at local time t (seconds). Transitions are handled by draw() itself via p and t.
// Offline audio: sb.audio is a module whose default export has build(ctx, { duration, scenes, starts, sr }).
window.renderAudio = async () => {
  if (!sb.audio) return null;
  const mod = await import('/' + sb.audio + '?v=' + Date.now());
  const sr = 44100, len = Math.ceil(total * sr);
  const oac = new OfflineAudioContext(2, len, sr);
  await mod.default.build(oac, { duration: total, scenes: sb.scenes, starts, sr });
  const buf = await oac.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const bytes = new Uint8Array(44 + len * 4), dv = new DataView(bytes.buffer);
  const wr = (o, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); };
  wr(0, 'RIFF'); dv.setUint32(4, 36 + len * 4, true); wr(8, 'WAVE'); wr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, len * 4, true);
  for (let i = 0, o = 44; i < len; i++, o += 4) {
    dv.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    dv.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
};
window.renderAt = async (i, t, imgFmt) => {
  const s = sb.scenes[i], sc = scenes[i];
  ctx.save(); ctx.clearRect(0, 0, W, H);
  await sc.draw(ctx, t, { w: W, h: H, p: Math.min(1, t / s.duration), duration: s.duration, scene: s, start: starts[i], total, gt: starts[i] + t, format: fmt.id, u, vertical, safe, ...helpers });
  ctx.restore();
  return imgFmt === 'jpeg' ? c.toDataURL('image/jpeg', 0.96).slice(23) : c.toDataURL('image/png').slice(22);
};
</script>`;

const HELPERS = `
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  linear: t => t,
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
// map time range [a,b] to 0..1 with easing
export const seg = (t, a, b, e = ease.out) => e(clamp((t - a) / (b - a)));
export function gradient(ctx, w, h, stops, angle = 135) {
  const r = angle * Math.PI / 180, cx = w / 2, cy = h / 2, d = Math.abs(w * Math.cos(r)) / 2 + Math.abs(h * Math.sin(r)) / 2;
  const g = ctx.createLinearGradient(cx - Math.cos(r) * d, cy - Math.sin(r) * d, cx + Math.cos(r) * d, cy + Math.sin(r) * d);
  stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c));
  return g;
}
export function text(ctx, str, x, y, { size = 64, weight = 700, family = 'sans-serif', color = '#fff', align = 'left', alpha = 1, maxWidth, lineHeight = 1.15 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.font = weight + ' ' + size + 'px ' + family;
  const words = String(str).split(' '), lines = []; let line = '';
  for (const w of words) { const n = line ? line + ' ' + w : w; if (maxWidth && ctx.measureText(n).width > maxWidth && line) { lines.push(line); line = w; } else line = n; }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * lineHeight));
  ctx.restore(); return lines.length * size * lineHeight;
}
export function roundRect(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
export const helpers = { clamp, lerp, ease, seg, gradient, text, roundRect };
`;

export function startServer(dir) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      let p = decodeURIComponent(url.pathname);
      if (p === '/__swit/harness.html') { res.setHeader('content-type', 'text/html'); return res.end(HARNESS); }
      if (p === '/__swit/formats.json') { res.setHeader('content-type', 'application/json'); return res.end(await fs.readFile(new URL('../formats.json', import.meta.url))); }
      if (p === '/__swit/helpers.js') { res.setHeader('content-type', 'text/javascript'); return res.end(HELPERS); }
      const file = path.resolve(dir, '.' + p);
      if (!file.startsWith(path.resolve(dir) + path.sep)) { res.statusCode = 403; return res.end(); }
      const buf = await fs.readFile(file);
      res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
    } catch { res.statusCode = 404; res.end('not found'); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openPage(dir) {
  const server = await startServer(dir);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  await page.setViewport({ width: 800, height: 450 });
  await page.goto(`http://127.0.0.1:${server.address().port}/__swit/harness.html`);
  try { await page.waitForFunction('window.__ready === true', { timeout: 15000 }); }
  catch { await browser.close(); server.close(); throw new Error('Scenes failed to load: ' + (errors.join('; ') || 'timeout')); }
  return { page, errors, close: async () => { await browser.close(); server.close(); } };
}

const readSb = async dir => JSON.parse(await fs.readFile(path.join(dir, 'storyboard.json'), 'utf8'));

// Render one preview PNG per scene (at scene midpoint, or `only` = scene ids).
export async function renderFrames(dir, only) {
  const sb = await readSb(dir);
  await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
  const { page, errors, close } = await openPage(dir);
  const out = [];
  try {
    for (let i = 0; i < sb.scenes.length; i++) {
      const s = sb.scenes[i];
      if (only?.length && !only.includes(s.id)) continue;
      const b64 = await page.evaluate((i, t) => window.renderAt(i, t), i, s.duration * (s.previewAt ?? 0.6));
      const rel = `frames/${s.id}.png`;
      await fs.writeFile(path.join(dir, rel), Buffer.from(b64, 'base64'));
      s.frame = rel; out.push(rel);
    }
    if (errors.length) throw new Error('Scene errors: ' + errors.join('; '));
  } finally { await close(); }
  await fs.writeFile(path.join(dir, 'storyboard.json'), JSON.stringify(sb, null, 2));
  return out;
}

// Render the whole video to video.mp4 (optionally audio-less).
// Render only the soundtrack to a WAV file (fast way to tune a mix without rendering frames).
export async function renderAudioFile(dir, outPath) {
  const sb = await readSb(dir);
  if (!sb.audio) throw new Error('storyboard.json has no "audio" module.');
  const { page, errors, close } = await openPage(dir);
  try {
    const b64 = await page.evaluate('window.renderAudio()');
    if (errors.length) throw new Error('Audio errors: ' + errors.join('; '));
    await fs.writeFile(outPath, Buffer.from(b64, 'base64'));
  } finally { await close(); }
  return outPath;
}

// One render per project at a time: a lock file holds the owner's pid.
async function acquireLock(dir) {
  const lock = path.join(dir, '.render.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try { const fh = await fs.open(lock, 'wx'); await fh.writeFile(String(process.pid)); await fh.close(); return async () => { await fs.rm(lock, { force: true }); }; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const pid = parseInt(await fs.readFile(lock, 'utf8').catch(() => '0'), 10);
      let alive = false; try { process.kill(pid, 0); alive = pid > 0; } catch {}
      if (alive) throw new Error(`Another render of this project is already running (pid ${pid}). Wait for it to finish.`);
      await fs.rm(lock, { force: true }); // stale lock from a crashed render
    }
  }
  throw new Error('Could not take the render lock.');
}

// Render the whole video to video.mp4 (with audio when the storyboard has an audio module).
export async function renderVideo(dir, onProgress = () => {}) {
  const release = await acquireLock(dir);
  try { return await renderVideoLocked(dir, onProgress); } finally { await release(); }
}

async function renderVideoLocked(dir, onProgress) {
  const sb = await readSb(dir);
  const fps = sb.fps || 30;
  const { page, errors, close } = await openPage(dir);
  const outFile = path.join(dir, 'video.mp4');
  const tmpWav = path.join(dir, '.audio.tmp.wav');
  const tmpFile = path.join(dir, '.video.tmp.mp4'); // written here, then renamed so viewers never see a half-written file
  const total = sb.scenes.reduce((a, s) => a + Math.round(s.duration * fps), 0);
  let ff;
  try {
    const { W, H } = await page.evaluate('window.__info');
    const audioB64 = sb.audio ? await page.evaluate('window.renderAudio()') : null;
    if (audioB64) await fs.writeFile(tmpWav, Buffer.from(audioB64, 'base64'));
    const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
    if (audioB64) args.push('-i', tmpWav, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(sb.crf || 21), '-movflags', '+faststart', tmpFile);
    ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'pipe'] });
    let ffErr = ''; ff.stderr.on('data', d => ffErr += d);
    const done = new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg failed: ' + ffErr))); ff.on('error', rej); });
    let n = 0;
    for (let i = 0; i < sb.scenes.length; i++) {
      const frames = Math.round(sb.scenes[i].duration * fps);
      for (let f = 0; f < frames; f++) {
        const b64 = await page.evaluate((i, t) => window.renderAt(i, t, 'jpeg'), i, f / fps);
        if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
        if (++n % 30 === 0) onProgress(n / total);
      }
    }
    ff.stdin.end(); await done;
    if (errors.length) throw new Error('Scene errors: ' + errors.join('; '));
    await fs.rename(tmpFile, outFile);
    return { file: outFile, seconds: total / fps, width: W, height: H, fps };
  } catch (e) {
    if (ff) ff.kill();
    await fs.rm(tmpFile, { force: true });
    throw e;
  } finally {
    try { await fs.rm(tmpWav, { force: true }); }
    finally { await close(); }
  }
}
