# Changelog

## 0.3.0 - 2026-10-07

- Keyboard shortcuts you can change: every action in the player, review, storyboard and home screens has a binding. Record a new one in Settings, Keyboard.
- Help popup on `?` that lists every shortcut with its current binding.
- Settings: videos folder, default note duration, autoplay, loop, captions on by default, and seek step.
- About page with the version and this changelog.
- Videos can now carry a soundtrack: the renderer builds `audio.js` offline and adds it to the MP4. A new `swit_render_audio` tool renders just the sound so a mix can be checked in seconds.
- Fixed the Review toolbar overlapping the "Ask Claude" button and the empty-state text being cut off.
- Keys now also work through your input method (fcitx, ibus): the window reads key presses directly as well as through shortcuts, so shortcuts no longer go dead on some setups.
- The player's inspector and timeline keys (I and T) now always toggle, even in narrow windows.
- Rendering takes a lock per project, so two renders can never write the same video at once. That collision left videos without sound or without an index. Frames also go to the encoder as JPEG, which is faster.
- Fixed the project folder table stopping short with empty space below it, and the title hiding behind it.

## 0.2.0 - 2026-10-07

- Notes now have a duration: 1s, 3s, 5s, the scene, or the whole video. Change it on any comment.
- Videos render to a temporary file and are swapped in when done, so the player never reads a half-written file. This fixes the glitchy playback and the h264 errors.
- Only the visible screen decodes video, and the player resumes your position after a re-render.
- Play and pause are drawn icons instead of text glyphs.
- Home cards show one proper 16:9 frame.
- App icon, launcher and install rules. The installed binary now starts correctly.

## 0.1.0 - 2026-10-07

- First release: Home, project folder, storyboard, player and review screens.
- MCP server so Claude can create projects, render frames and videos, and read and resolve comments.
- The `swit-video` skill: ask questions first, storyboard before building, then fix comments.
