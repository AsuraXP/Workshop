# Engine, `MC v2` Rig & World Palettes Reference

All scene modules live in `<project>/scenes/` and import from `/kit/engine/*.js` (resolved identically in Playwright Chromium and headless Node `@napi-rs/canvas`).

---

## 1. Time & Animation Discipline (`draw(g, t, state, info)`)

- **`t` is ALWAYS shot-local seconds (`0 .. info.dur`)**; `info.globalT` is global film seconds.
  - Correct: `const x = key(t, [[0, 320], [info.dur, 580]], ease.inOut);`
  - Never pass global film timestamps into `key(t, ...)`.
- **Classical Motion:** Use `anticipate(t, t0, t1)` before jumps/points, `ease.outBack` or `spring(t, start, dur)` for lively settles, and keep characters alive during quiet visual beats with `breathe(pose, t)`, `autoBlink(t, seed)`, and smooth `brow` / `browTilt` / `mouth` transitions.
- **Deliberate Stillness:** Set `"hold": true` in `story/shots.json` on intentional calm tableaux (`> 0.75s`) so `qa.py` distinguishes artful stillness from accidental freezes.

---

## 2. `/kit/engine/rig2d.js` — The `MC v2` House Rig

Recurring human characters always use **`MC v2`** (`240` units tall at `s = 1`, feet at `[x, y]`):
- **Anatomy:** Matte charcoal-black circular head (`HR = 25`, `S().ink`) with razor-tapered crescent `rim` light, vertical warm-cream oval eyes (`#fff6e6`), expressive flat pill brow bars (which carry 70% of acting), understated mouth (no nose, no teeth), cylindrical-shaded rounded tunic/coat, thin dark limbs, solid round ball hands (`r = 7.6`), and flat feet over a soft contact shadow.
- **`drawFigure(g, opts)`:**
  - Transform: `x`, `y`, `s`, `facing` (`1` right, `-1` left), `kid` (`false`), `rot` (`0`), `shadow` (`true`).
  - Wardrobe: `coat` (`COATS.{cream, sage, peach, sky, butter, coral, lavender, slate, mustard, teal}`), `outfit: { top: 'coat'|'cardigan'|'labcoat'|'hoodie'|'suit'|'tshirt'|'dress'|'royal'|'none', shirtColor, pants, shoes, accent, sleeveCap, head: 'none'|'elder'|'ponytail'|'bun'|'curly'|'spiky'|'cap'|'beanie'|'fedora'|'headband'|'crown' }`, `glasses` (`false`), `aged` (`false`).
  - Lighting: `rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 }` (world-space vector!).
  - Acting: `pose` (`POSES` name or custom joint object), `expr` (`'neutral'|'joy'|'smile'|'smirk'|'worry'|'determined'|'angry'|'sad'|'surprised'|'shocked'|'awe'|'thinking'|'confused'|'sleepy'`), float overrides `brow` (`-1..1`), `browTilt` (`-1..1`), `browArch` (`-1..1`), `mouth` (`-1..1`), `openMouth` (`0..1`), `talk` (`0..1`), `blink` (`0..1`), `look: [lx, ly]`, `headTilt`.
  - Built-in props: `prop: 'mug'|'phone'|'lantern'|'flashlight'|'clipboard'|'book'|'briefcase'|'wrench'`, `propColor`.
- **Helpers:** `bigFace(g, x, y, r, opts)` (close-ups), `crowd(g, opts)`, `POSES`, `mixPose(a, b, k)`, `posesAt(t, track)`, `breathe(pose, t, amt=1)`, `walkPose(phase, run=false)`, `autoBlink(t, seed=0)`, `handPos(opts, 'F'|'B')`, `headPos(opts)`, `jointPos(opts, joint)`.

---

## 3. `/kit/engine/core.js`, `fx2d.js`, `ui2d.js` & `three-kit.js`

- **`core.js`:**
  - Stage: `E = { W, H, fps, vertical, style, styleId, cfg, shots }`, `V(landscapeVal, verticalVal)`.
  - Math: `clamp`, `lerp`, `prog(t, a, b)`, `ease.{linear, smooth, in, out, inOut, sine, outBack, outElastic}`, `anticipate`, `spring`, `key`, `localKeys`, `rng`, `noise`, `shake`.
  - Color & Drawing: `S()`, `mood(name)` (`'day'|'golden'|'dusk'|'night'|'storm'|'interiorWarm'|'interiorCool'|'studio'|'void'`), `mix`, `alpha`, `shade`, `rr`, `seg`, `poly`, `circle`, `ring`, `linGrad`, `radGrad`, `glow`, `veil`, `fillRect`, `backdrop`, `text`, `measure`.
  - Depth & Shots: `layer(g, cam, depth, fn)` (`0.25` sky/bg, `0.6` mid, `1.0` stage, `1.25` fg), `blurLayer`, `registerShot(id, { kind: '2d'|'3d', init?, draw })`.
- **`fx2d.js`:** `beam`, `lensStreak`, `haze`, `skyStreaks`, `bokeh`, `tileWall`, `foliage`, `hills`, `skyline`, `stars`, `clouds`, `motes`, `rain`, `lightning`, `speedLines`, `shockwave`, `ripples`, `flame`.
- **`ui2d.js` (use sparingly—visuals first, minimal labels!):** `card`, `titleCard`, `storyCaption`, `dataCard`, `compareBars`, `timelineStrip`, `blueprint`, `callout`, `dimension`, `readout`, `endCard` (`cta: false` default).
- **`three-kit.js` (`kind: '3d'` via Playwright Chromium):** `THREE`, `makeStage`, `figure3D`, `toonMat`, `flatMat`, `glowMat`, `addOutline`, `box`, `tree`, `orbitCam`.

---

## 4. World Color Palettes (`config.json -> "style"`)

All palettes keep the same sparse-voice Awaken film direction while shifting world atmosphere:
- `awaken` *(default)*: Twilight periwinkle shadows + warm sunset peach/amber rim light
- `daylight`: Crisp sky blue + warm cream sunlight
- `cinema`: Deep slate-navy + storybook ember gold
- `noir`: Midnight obsidian + cool silver rim light
- `arctic`: Glacial navy + glowing ice-cyan
- `emerald`: Deep forest slate + bioluminescent mint & gold
- `ember`: Volcanic obsidian + molten crimson/copper
- `sakura`: Dusk plum + soft rose-peach haze
- `retro`: Muted vintage teal, mustard & print grain

---

## 5. `config.json` & `story/shots.json` Schemas

```json
// story/shots.json
{
  "shots": [
    {
      "id": "s01", "start": 0.0, "dur": 4.2, "in": "fadeBlack", "out": "cut", "hold": false,
      "location": "studyRoom", "summary": "Quiet warm room; Milo holds steaming mug before first hook line.",
      "subtitles": [{ "at": 1.4, "end": 3.8, "speaker": "", "text": "Right now, you feel the mug in your hand." }],
      "dialogue": [{ "at": 1.4, "src": "audio/lines/s01.wav", "gain": 0, "pan": 0.0 }],
      "ambience": { "kind": "room", "gain": -25 },
      "sfx": [{ "at": 0.5, "kind": "whoosh_soft", "gain": -13 }]
    }
  ]
}
```
