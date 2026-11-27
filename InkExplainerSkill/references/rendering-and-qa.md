# Rendering, Project Contract, and QA

## Project files

A project is a directory with:

```text
project/
├── project.json
├── storyboard.json
├── src/scenes.mjs
├── audio/vo.mp3
├── audio/vo.words.json
├── audio/music.wav
├── audio/mix.wav
└── exports/
```

`project.json` stores title, dimensions, fps, duration, narration voice, and relative paths. `storyboard.json` stores the continuous word-timed panel list. `src/scenes.mjs` exports `panels`, an array whose entries have `id`, `start`, `end`, and `draw(ctx, { time, progress, panel })`.

Each draw function paints its complete 1920×1080 frame. It can import `kit/scene-kit.mjs` using a relative path to the installed skill directory, or copy the small required helpers into the project if the skill will not travel with it. Keep scene code and config inside the project; do not import anything from the Awaken skill.

## Render

```bash
node kit/render.mjs --project /path/to/project
```

The renderer streams raw RGBA frames to FFmpeg, uses hard cuts at storyboard boundaries, and muxes `audio/mix.wav`. Set `FFMPEG_BIN` if FFmpeg is not on `PATH`. Output is written to the `output` path in `project.json` (default `exports/final.mp4`).

## QA checklist

1. The storyboard covers the complete narration duration with no gaps or overlaps.
2. Every panel has a visual, camera, composition, and scene function; no generated placeholder remains.
3. Cuts occur at measured word/clause boundaries. No word is clipped, duplicated, or omitted.
4. Panel durations stay near the target; holds outside 2.0–2.8 seconds have an editorial reason.
5. Consecutive framings are not repeated; full contact sheet has varied staging and camera distance.
6. Figures have white circular heads, bold black outlines, solid fills, and consistent proportions.
7. Text and important art are title-safe, readable at 480px wide, and do not duplicate narration unnecessarily.
8. Audio duration aligns with the video; voice is intelligible; music is quieter; true peak is under −1.5 dBTP.
9. Decode the final MP4 with FFmpeg and inspect the start, middle, last cut, and final second.

The validator checks timing and required fields. After rendering, run `python kit/tools/qa.py --project /path/to/project` to probe dimensions, frame rate, duration, codecs, and decode integrity. Passing either script does not replace a visual review or listening pass.
