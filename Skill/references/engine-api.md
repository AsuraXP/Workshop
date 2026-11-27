# Engine & Tooling API Reference

All scene modules live in `<project>/scenes/` and import from `/kit/engine/*.js` (resolved identically in both the browser/Playwright player and the headless Node `@napi-rs/canvas` renderer).

---

## 1. Project Files & Schemas

### `<project>/config.json`
```json
{
  "title": "Film Title",
  "aspect": "16:9",
  "width": 1920,
  "verticalWidth": 1080,
  "fps": 24,
  "duration": 18.0,
  "style": "awaken",
  "voiceover": null,
  "captions": false,
  "storyCaptions": true,
  "bars": "none",
  "music": {
    "sections": [
      { "at": 0.0, "mood": "curious", "gain": -15 },
      { "at": 10.0, "mood": "wonder", "gain": -15 }
    ]
  },
  "loudness": -14.0
}
```
- `style`: `'awaken'` *(default)* | `'daylight'` | `'cinema'` | `'noir'` | `'arctic'` | `'emerald'` | `'ember'` | `'sakura'` | `'retro'`.
- `voiceover`: relative path e.g. `"audio/voiceover.mp3"`, or `null` for script/dialogue/silent films.
- `captions`: `true` enables word-by-word highlight captions (from `timeline/words.json`, great for `9:16`).
- `storyCaptions`: `true` *(default)* renders clean lower-band `shot.caption` / `shot.subtitles` when present.
- `bars`: `'none'` *(default)* | `'thin'` | `'wide'` | `'scope'` | pixel height number.

### `<project>/story/shots.json`
```json
{
  "shots": [
    {
      "id": "s01",
      "start": 0.0,
      "dur": 3.5,
      "in": "fadeBlack",
      "out": "cut",
      "hold": false,
      "location": "plaza",
      "summary": "What happens visually in this shot",
      "speaker": "Host",
      "caption": "Optional lower-band subtitle text.",
      "subtitles": [
        { "at": 0.3, "end": 2.8, "speaker": "Host", "text": "Timed subtitle cue." }
      ],
      "dialogue": [
        { "at": 0.3, "src": "audio/lines/s01.wav", "gain": 0, "pan": 0.0 }
      ],
      "ambience": { "kind": "wind", "gain": -26 },
      "sfx": [
        { "at": 0.4, "kind": "whoosh_soft", "gain": -10, "pan": -0.2 }
      ]
    }
  ]
}
```
- Transitions (`in`): `'cut'` *(default)* | `'fadeBlack'` | `'fadeWhite'` | `'dissolve'` | `'wipe'` (`inDur` default `0.45`). `out`: `'cut'` | `'fadeBlack'`.
- `hold`: set `true` when a shot is intentionally motionless for `> 0.75s`.

---

## 2. `/kit/engine/core.js`

- **Stage state:** `E = { W, H, PX, fps, vertical, style, styleId, cfg, words, shots }`, `V(landscapeVal, verticalVal)`.
- **Timing & Easing:** `clamp(x, a=0, b=1)`, `lerp(a, b, k)`, `prog(t, a, b)`, `ease.{linear, smooth, in, out, inOut, sine, outBack, outElastic}`, `anticipate(t, start, end, anti=0.12, over=0.06)`, `spring(t, start=0, dur=0.65)`, `key(t, [[t0, v0], [t1, v1, easeFn?], ...])`, `localKeys(globalFrames, shotStart, shotDur)`.
- **Determinism & Sync:** `rng(seed)`, `noise(x, seed)`, `shake(t, amp, freq, seed)`, `talkAmount(globalT, from, to)`, `wordTime(wordPrefix, afterSec)`.
- **Color & Style:** `S()`, `mood(name)` (`'day' | 'golden' | 'dusk' | 'night' | 'storm' | 'interiorWarm' | 'interiorCool' | 'studio' | 'void'`), `COATS`, `mix(c1, c2, k)`, `alpha(c, a)`, `shade(c, k)`.
- **2D Primitives:** `rr(g, x, y, w, h, r)`, `seg(g, pts, w, col, cap)`, `poly(g, pts, fill)`, `circle(g, x, y, r, fill)`, `ring(g, x, y, r, w, col)`, `linGrad`, `radGrad`, `glow(g, x, y, r, col, a)`, `veil`, `fillRect`, `backdrop`, `text(g, str, x, y, opts)`, `measure(g, str, size, font, weight)`.
- **Camera & Shots:** `layer(g, cam, depth, fn)`, `blurLayer(g, blurPx, fn, cam, depth)`, `registerShot(id, { kind: '2d'|'3d', init?, draw(g, t, state, info) })`.

---

## 3. `/kit/engine/rig2d.js` (`MC v2`)

- **`drawFigure(g, opts)`:**
  - Position & scale: `x`, `y` (ground under feet), `s` (`1` = 240 units tall), `facing` (`1` right, `-1` left), `kid` (`false`), `rot` (`0`), `shadow` (`true`).
  - Wardrobe: `coat` (hex, default `COATS.cream` `'#f6efdd'`, or `null` for bare silhouette), `outfit: { top: 'coat'|'cardigan'|'labcoat'|'hoodie'|'suit'|'tshirt'|'dress'|'royal'|'none', shirtColor, pants, shoes, accent, sleeveCap, head: 'none'|'elder'|'ponytail'|'bun'|'curly'|'spiky'|'cap'|'capBack'|'beanie'|'fedora'|'headband'|'crown', hatColor, hairColor }`, `glasses` (`false`), `aged` (`false`).
  - Lighting: `rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 }` (`dir` is world-space!).
  - Acting & Face: `pose` (name in `POSES` or pose object), `expr` (`'neutral' | 'joy' | 'happy' | 'smile' | 'smirk' | 'worry' | 'nervous' | 'determined' | 'angry' | 'sad' | 'cry' | 'surprised' | 'shocked' | 'scared' | 'awe' | 'thinking' | 'confused' | 'sleepy'`), continuous overrides `brow` (`-1..1`), `browTilt` (`-1..1`), `browArch` (`-1..1`), `mouth` (`-1..1`), `openMouth` (`0..1`), `talk` (`0..1`), `blink` (`0..1` or bool), `look: [lx, ly]`, `headTilt`, `blush` (`0..1`).
  - Built-in held props: `prop: 'mug' | 'phone' | 'lantern' | 'flashlight' | 'clipboard' | 'book' | 'briefcase' | 'sword' | 'flag' | 'wrench'`, `propColor`.
- **Close-Ups & Crowds:** `bigFace(g, x, y, r, opts)`, `crowd(g, { x, y, w, n, scale, seed, color, rimColor })`.
- **Pose & Socket Helpers:** `POSES`, `mixPose(a, b, k)`, `posesAt(t, track)`, `breathe(pose, t, amt=1)`, `walkPose(phase, run=false)`, `autoBlink(t, seed=0)`, `handPos(opts, 'F'|'B')`, `headPos(opts)`, `jointPos(opts, joint)`.

---

## 4. `/kit/engine/fx2d.js`, `ui2d.js` & `three-kit.js`

- **`fx2d.js`:** `beam`, `lensStreak`, `haze`, `skyStreaks`, `bokeh`, `tileWall`, `foliage`, `hills`, `skyline`, `stars`, `clouds`, `motes`, `rain`, `lightning`, `speedLines`, `shockwave`, `ripples`, `flame`.
- **`ui2d.js`:** `card`, `titleCard`, `storyCaption`, `timelineStrip`, `dataCard`, `compareBars`, `blueprint`, `callout`, `dimension`, `readout`, `progressCounter`, `captions`, `endCard`.
- **`three-kit.js` (`kind: '3d'` shots via Playwright Chromium):** `THREE`, `makeStage({ mood, fov, fog, bloom, ground })`, `figure3D({ coat, rimColor, scale, outfit })` (3D `MC v2` with coat, oval eyes, brow bars, ball hands, `.pose(t, 'idle'|'walk'|'run')`), `toonMat`, `flatMat`, `glowMat`, `addOutline`, `box`, `tree`, `orbitCam`.
