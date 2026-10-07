# Swit

A video studio where Claude writes the video as JavaScript and you review it in a native app.

1. You ask Claude to "create a pro video". The `swit-video` skill asks a few questions first.
2. Claude drafts a storyboard and renders a few preview frames for you to check.
3. After you approve, Claude renders the full video into a project folder.
4. In Swit you open the folder, play the video, draw on frames, or comment on lines of scene code.
5. Tell Claude "fix the comments". It reads them through the MCP server, fixes the code, re-renders and marks them resolved.

## Project folder

```
my-video/
  brief.md
  storyboard.json     title, size, fps, scenes[{id, file, name, caption, duration, note, approved}]
  scenes/scene-01.js  one canvas module per scene
  frames/scene-01.png storyboard preview frames
  video.mp4           the rendered video
  comments.json       review comments from Swit
```

A scene is a plain JS module that draws from time `t` alone, so any frame can be rendered by itself:

```js
export default {
  draw(ctx, t, { w, h, ease, seg, gradient, text }) {
    ctx.fillStyle = gradient(ctx, w, h, ['#f2b36b', '#d9722f']);
    ctx.fillRect(0, 0, w, h);
    const k = seg(t, 0.2, 1.0, ease.outBack);
    text(ctx, 'Mornings, sorted.', w / 2, h / 2 + (1 - k) * 80, { size: 120, align: 'center', alpha: k });
  },
};
```

## Parts

| Part | Where | What it does |
|---|---|---|
| App | `*.qml`, `backend.*`, `main.cpp` | Qt 6 / QML app: Home, project folder, storyboard, player, review |
| MCP server | `mcp/` | Tools Claude calls: init project, render frames, render video, list and resolve comments |
| Skill | `skill/SKILL.md` | Tells Claude how to ask questions, storyboard first, build, and fix comments |

Rendering uses headless Chromium (puppeteer-core) to draw each frame and ffmpeg to encode.

## Setup

Requirements: Qt 6.5+ (Quick, QuickControls2, Multimedia), CMake, Node 20+, ffmpeg, Chromium.

```sh
# app
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
./build/swit

# MCP server
cd mcp && npm install
claude mcp add --scope user swit -- node "$(pwd)/server.mjs"

# skill
mkdir -p ~/.claude/skills/swit-video && cp skill/SKILL.md ~/.claude/skills/swit-video/
```

Videos live in `~/videos` by default. Set `SWIT_VIDEOS` to change it, and `SWIT_CHROME` if Chromium is not at `/usr/bin/chromium`.

Swit refreshes by itself when Claude changes a project, and the comments you leave are written straight to `comments.json`.

## Shortcuts

Player: `Space` play, `I` inspector, `T` timeline, `C` captions, `M` mute, `F` fullscreen, `Left` / `Right` jump 5s. Review: `Space` play, `Left` / `Right` step 1s. `Alt+Left` goes back.
