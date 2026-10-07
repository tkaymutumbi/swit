---
name: swit-video
description: Create professional videos with Swit (the user's video studio app) using JavaScript canvas scenes. Use whenever the user says "create a video", "make a pro video", "promo", "explainer", "reel", "animate this", or asks to read/fix comments left in Swit. Asks clarifying questions first, drafts a storyboard with a few preview frames, then builds the video into a folder the user opens in Swit.
---

# Swit video skill

Videos are code. Each scene is a JS canvas module rendered frame by frame (headless Chromium) and encoded by ffmpeg. The user reviews everything in the Swit app: Home -> project folder -> storyboard / video / comments. Tools come from the `swit` MCP server (`swit_*`).

## 1. Ask first (one short round, max 5 questions)

Use AskUserQuestion. Skip anything the user already said. Cover:
- Purpose and audience (launch promo, explainer, social ad, tutorial).
- Length and format (15s / 30s / 60s; 16:9, 9:16 or 1:1).
- Brand: name, colours, fonts, logo file, tone.
- Content: key message, offer or call to action, any text that must appear verbatim.
- Audio: none, music file, or voiceover script (renderer is silent unless a file is supplied).

## 2. Storyboard first

1. `swit_init_project` with scenes (name, caption, duration, note). 3 to 8 scenes is typical.
2. Write real scene code in `scenes/scene-NN.js` (see contract). Do not leave the starter scene.
3. `swit_render_frames` for a few scenes only (first, one middle, last) so the user can check direction. Leave the rest as notes in storyboard.json.
4. Tell the user: open Swit, go Home, open the folder, open the Storyboard. Stop and wait for approval or comments. Do not render the video yet.

## 3. Build

After approval: `swit_render_frames` for the remaining scenes if wanted, then `swit_render_video`. Report the folder path and duration. Never claim the video looks right without having rendered frames.

## 4. Fix comments

When asked to "read the comments" or "fix what is in the comments":
1. `swit_list_comments` (status open). Each has scene, sceneFile, line (code comments), time and a normalized region x/y/w/h (0..1 of the frame) for drawn ones. Drawn notes also carry `span` (`time`, `scene` or `video`) and `duration` in seconds: they were meant to apply only for that stretch, so change only what is visible then.
2. Edit the scene files (or storyboard.json) to address each one. Keep unrelated code unchanged.
3. `swit_render_frames` for touched scenes, then `swit_render_video`.
4. `swit_resolve_comment` for each fixed comment with a one line note. Leave a comment open and say why if it is unclear.

## Scene contract

```js
// scenes/scene-01.js
export default {
  draw(ctx, t, { w, h, p, duration, scene, ease, seg, lerp, clamp, gradient, text, roundRect }) {
    // t = seconds into this scene, p = 0..1, w x h = canvas size (default 1920x1080)
  },
};
```
- `seg(t, a, b, ease.outBack)` maps seconds a..b to 0..1 with easing. `text(ctx, str, x, y, {size, weight, family, color, align, alpha, maxWidth})` returns height used. `gradient(ctx, w, h, [colors], angle)`.
- Draw everything from t alone (no state, no Date.now, no Math.random without a fixed seed) so any frame can be rendered on its own.
- Fade or slide in the first ~0.4s and out in the last ~0.3s for clean cuts. Keep text inside a 6% safe margin.
- Images: put files in `assets/` and load with `new Image()` inside an async `draw`, awaiting `img.decode()`. Fonts: `@font-face` is not available, use system stacks or load a local file via the FontFace API from `assets/`.
- Extra draw args: `gt` (global seconds since the video started), `start` (this scene's start), `total`. Use `gt` for backgrounds and effects that must flow across scene cuts.
- storyboard.json fields: title, width, height, fps, audio (optional, e.g. "audio.js"), scenes[{id, file, name, caption, duration, note, previewAt}].
- Keep `previewAt` (0..1) away from the last 10% of a scene when it ends in a transition, so the preview frame is not a wipe.

## Sound

Set `"audio": "audio.js"` in storyboard.json. The module's default export has `build(ctx, { duration, scenes, starts, sr })`, where `ctx` is an `OfflineAudioContext` (stereo, 44.1 kHz). Schedule oscillators, noise, filters and a convolution reverb at absolute times, locked to the visuals (use `starts[i]` for scene starts). `swit_render_video` renders it offline and muxes it as AAC. Good baseline: a pad with a slow filter, bass, a kick that ducks the pad, a few hats, whooshes on cuts, blips on UI pops, keyboard clicks while text types, a bell on success, and a master fade out. Use a seeded random function so renders repeat exactly. Web Audio compressors add makeup gain, so put the final level control (and the fade out) after the compressor and limiter. Check the mix with `swit_render_audio` and `ffmpeg -i audio-preview.wav -af ebur128=peak=true -f null -`: aim for about -14 LUFS integrated and a peak under -1 dBFS. A peak at 0.0 dB means clipping.

## Look: restrained, not flashy

Premium means restraint. The reference project in `examples/swit-intro` in the Swit repo shows the target: a flat dark neutral background, one accent colour used sparingly, off-white type set large and left aligned, hairline panels, short eased motion, and a plain curtain wipe on each cut. Its `scenes/_kit.js` has the helpers (word-by-word reveal, springs, panels, cursor and click ripple, wipe). Copy it into new projects.

Do not use: glows or shadow blur, purple or multi-colour gradients, gradient text, sparkles or particles, film grain, glass or frosted panels, aurora or blurred blobs, timecode or HUD overlays, or sound-reactive decoration. They read as generic AI output. If the user names a brand, use its colours and type instead. Ask for the brand palette in the questions step when unsure.

Any rectangle helper must multiply the current `globalAlpha` (not overwrite it), or shapes will show before their text fades in.

## Quality bar

Never use emojis or font symbols (check marks, arrows, play glyphs) in scene text or UI. Draw icons as paths or shapes. Render to a temp file and rename, so Swit never loads a half-written video (the MCP render tool already does this).


Pro means: one idea per scene, large type (96px+ for headlines at 1080p), consistent palette of 3 colours, eased motion (never linear), 3 to 6 seconds per scene, a clear end card with the call to action.
