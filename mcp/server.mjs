#!/usr/bin/env node
// Swit MCP server: lets Claude create, render and review video projects that the Swit app opens.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { renderFrames, renderVideo } from './render.mjs';

const ROOT = process.env.SWIT_VIDEOS || path.join(os.homedir(), 'videos');
const REGISTRY = path.join(os.homedir(), '.config', 'swit', 'projects.json');

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';
const projectDir = p => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const readJson = async (f, d) => { try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch { return d; } };
const writeJson = (f, v) => fs.writeFile(f, JSON.stringify(v, null, 2) + '\n');
const text = t => ({ content: [{ type: 'text', text: typeof t === 'string' ? t : JSON.stringify(t, null, 2) }] });
const fail = t => ({ isError: true, content: [{ type: 'text', text: t }] });

async function register(dir) {
  const reg = await readJson(REGISTRY, { projects: [] });
  if (!reg.projects.includes(dir)) reg.projects.push(dir);
  await fs.mkdir(path.dirname(REGISTRY), { recursive: true });
  await writeJson(REGISTRY, reg);
}

const STARTER_SCENE = name => `// ${name}: draw(ctx, t, { w, h, p, duration, scene, ease, seg, lerp, gradient, text, roundRect })
export default {
  draw(ctx, t, { w, h, ease, seg, gradient, text }) {
    ctx.fillStyle = gradient(ctx, w, h, ['#f2b36b', '#d9722f']);
    ctx.fillRect(0, 0, w, h);
    const k = seg(t, 0.2, 1.0, ease.outBack);
    text(ctx, ${JSON.stringify(name)}, w / 2, h / 2 + (1 - k) * 80, { size: 120, align: 'center', alpha: k });
  },
};
`;

const server = new McpServer({ name: 'swit', version: '0.1.0' });

server.tool('swit_init_project',
  'Create a new Swit video project folder (brief.md, storyboard.json, scenes/*.js, comments.json) under ~/videos and register it so it shows on Swit Home. Then edit storyboard.json and scenes/*.js directly.',
  { name: z.string().describe('Folder name, e.g. "brew-co-launch"'), title: z.string(), brief: z.string().describe('What the video is for, audience, tone, length'),
    scenes: z.array(z.object({ name: z.string(), caption: z.string().optional(), duration: z.number().positive(), note: z.string().optional() })).min(1),
    width: z.number().default(1920), height: z.number().default(1080), fps: z.number().default(30) },
  async a => {
    const dir = path.join(ROOT, slug(a.name));
    if (await fs.stat(dir).then(() => true, () => false)) return fail(`${dir} already exists. Pick another name or edit it in place.`);
    await fs.mkdir(path.join(dir, 'scenes'), { recursive: true });
    await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
    const scenes = a.scenes.map((s, i) => ({ id: `scene-${String(i + 1).padStart(2, '0')}`, file: `scenes/scene-${String(i + 1).padStart(2, '0')}.js`, name: s.name, caption: s.caption || '', duration: s.duration, note: s.note || '', approved: false }));
    for (const s of scenes) await fs.writeFile(path.join(dir, s.file), STARTER_SCENE(s.name));
    await writeJson(path.join(dir, 'storyboard.json'), { title: a.title, width: a.width, height: a.height, fps: a.fps, scenes });
    await fs.writeFile(path.join(dir, 'brief.md'), `# ${a.title}\n\n${a.brief}\n`);
    await writeJson(path.join(dir, 'comments.json'), { comments: [] });
    await register(dir);
    return text({ dir, next: 'Edit scenes/*.js to real designs, then call swit_render_frames so the user can approve the storyboard.' });
  });

server.tool('swit_render_frames',
  'Render one preview PNG per scene (frames/scene-NN.png) for the storyboard. Render only some scenes (e.g. first, middle, last) so the user can check direction before the full build.',
  { project: z.string(), scenes: z.array(z.string()).optional().describe('Scene ids like "scene-01". Omit for all.') },
  async ({ project, scenes }) => {
    try { return text({ frames: await renderFrames(projectDir(project), scenes) }); } catch (e) { return fail(String(e.message || e)); }
  });

server.tool('swit_render_video',
  'Render the full video.mp4 from storyboard.json and scenes/*.js. Only do this after the user approved the storyboard.',
  { project: z.string() },
  async ({ project }) => {
    const dir = projectDir(project);
    try { const r = await renderVideo(dir); await register(dir); return text({ ...r, open: 'Open Swit, go Home, then open this folder.' }); } catch (e) { return fail(String(e.message || e)); }
  });

server.tool('swit_list_comments',
  'List review comments the user left in Swit (drawn on the video or anchored to scene code). Each comment includes the scene id, scene file and line when known. Use before fixing.',
  { project: z.string(), status: z.enum(['open', 'resolved', 'all']).default('open') },
  async ({ project, status }) => {
    const dir = projectDir(project);
    const sb = await readJson(path.join(dir, 'storyboard.json'), { scenes: [] });
    const { comments = [] } = await readJson(path.join(dir, 'comments.json'), {});
    let start = 0; const bounds = sb.scenes.map(s => { const r = { s, start }; start += s.duration; return r; });
    const out = comments.filter(c => status === 'all' || c.status === status).map(c => {
      const hit = c.scene ? bounds.find(b => b.s.id === c.scene) : bounds.find(b => c.time >= b.start && c.time < b.start + b.s.duration);
      return { ...c, scene: hit?.s.id, sceneFile: c.file || hit?.s.file, localTime: hit && c.time != null ? +(c.time - hit.start).toFixed(2) : undefined };
    });
    return text(out.length ? out : 'No comments.');
  });

server.tool('swit_resolve_comment',
  'Mark a comment resolved after fixing it, with a one line note of what changed.',
  { project: z.string(), id: z.string(), note: z.string().optional() },
  async ({ project, id, note }) => {
    const f = path.join(projectDir(project), 'comments.json');
    const data = await readJson(f, { comments: [] });
    const c = data.comments.find(c => c.id === id);
    if (!c) return fail(`No comment ${id}.`);
    c.status = 'resolved'; c.resolution = note || ''; c.resolvedAt = new Date().toISOString();
    await writeJson(f, data);
    return text(`Resolved ${id}.`);
  });

server.tool('swit_list_projects', 'List registered Swit projects with scene count and open comment count.', {},
  async () => {
    const reg = await readJson(REGISTRY, { projects: [] });
    const rows = [];
    for (const dir of reg.projects) {
      const sb = await readJson(path.join(dir, 'storyboard.json'), null); if (!sb) continue;
      const cm = await readJson(path.join(dir, 'comments.json'), { comments: [] });
      rows.push({ dir, title: sb.title, scenes: sb.scenes.length, openComments: cm.comments.filter(c => c.status === 'open').length, hasVideo: await fs.stat(path.join(dir, 'video.mp4')).then(() => true, () => false) });
    }
    return text(rows);
  });

await server.connect(new StdioServerTransport());
