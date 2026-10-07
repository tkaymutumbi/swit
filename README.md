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

## Formats

Landscape 16:9 (1920x1080), vertical 9:16 (1080x1920, for TikTok, Reels and Shorts), square 1:1, portrait 4:5 and 4K. A project stores its `format` in `storyboard.json`. Set the default for new videos in Settings, or change one video from its storyboard. Scenes are laid out for one shape and get `u`, `vertical` and `safe` in their draw args; see `examples/swit-intro` and `examples/swit-intro-vertical`.

## Shortcuts, settings and help

Press `?` anywhere for the help popup, which lists every shortcut with its current key. Open Settings (the gear in the top bar, or `Ctrl+,`) to record new keys for any action, change the videos folder, set the default note duration, autoplay, loop, captions, and the jump size. The About page shows the version and the changelog (`CHANGELOG.md`).

## Sound

Add `"audio": "audio.js"` to `storyboard.json`. The file builds the soundtrack with the Web Audio API in an `OfflineAudioContext`, and the renderer adds it to the MP4. See `examples/swit-intro/audio.js`.
