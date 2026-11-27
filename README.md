# Code Film Studio (`v2.1.0`)

A unified, conflict-free **code-only 2D / 2.5D / 3D animated film & video production plugin** combining:
1. **Virtual Animation Studio Crew & 7-Gate Production Workflow** (`production/*.md`, continuity ledger, length-scaled batching, and 8-category Critic Rubric).
2. **The Parameterized `MC v2` House Character Rig** (`engine/rig2d.js` & `engine/three-kit.js`) — matte charcoal round head with razor-tapered spherical crescent rim light, vertical warm-cream oval eyes, expressive flat pill brow bars + continuous float sliders, cylindrical-shaded rounded coat/tunic (`COATS` + `cardigan`, `labcoat`, `hoodie`, `suit`, `elder`, etc.), thin crisp limbs, solid ball hands, flat feet, and exact world-space `handPos()` prop sockets.
3. **Dual-Backend Deterministic Engine & Screening Room** (`kit/render.mjs` & `kit/serve.mjs`) — Canvas2D + Three.js WebGL via parallel Playwright Chromium workers, automatic headless Node `@napi-rs/canvas` 2D fallback streaming lossless raw RGBA straight to FFmpeg, automatic `imageio-ffmpeg` binary fallback, and a zero-dependency HTTP `206` Range Screening Room + interactive studio player.
4. **Universal Intake & Genre Adaptability** — works seamlessly from **any** starting point (voiceover recording + Whisper alignment, plain or timestamped script, topic/idea prompt, multi-voice dialogue clips, or silent/BPM beat grid) across **9 built-in styles** (`awaken`, `daylight`, `cinema`, `noir`, `emerald`, `ember`, `arctic`, `sakura`, `retro`) in `16:9` and `9:16`.
5. **Procedural Score, 35+ Foley SFX & Two-Pass Mastering** (`kit/audio/`) — mood-sectioned procedural music, loopable location ambiences, 35+ synthesized SFX, automatic speech ducking (with seamless L-cut dialogue support), `.srt`/`.vtt` export, and two-pass linear `loudnorm`.
6. **Streaming Frame-Decoded QA (`kit/tools/qa.py`)** — `O(1)` memory full-video frame analysis generating true-aspect per-shot motion strips, localized `p99.9` freeze vs `"hold": true` checks, whole-film luminance flash screening, and EBU R128 loudness verification.

---

## How to Install & Use the Skill

### 1. One-Time Local Dependencies
Install Node (`>= 18`), Python (`>= 3.10`), and FFmpeg, plus the Python & JS kit packages:
```bash
pip install numpy scipy pillow opencv-python-headless imageio-ffmpeg

# Inside the skill kit folder:
cd code-film-studio/skills/make-film/kit
npm install @napi-rs/canvas   # fast headless 2D backend (or `npx playwright install chromium` for 2D + Three.js 3D)
```

### 2. Load Into Your Coding Agent

- **Claude Code (Plugin Mode — Recommended):**
  Launch Claude Code pointing directly at `code-film-studio/` (or unpack `code-film-studio.plugin`, which is a standard `.zip` plugin bundle):
  ```bash
  claude --plugin-dir /path/to/code-film-studio
  ```
- **Personal / Project Skills Folder (`~/.claude/skills/` or `.claude/skills/`):**
  Copy the 5 skill folders straight into your skills directory:
  ```bash
  mkdir -p ~/.claude/skills
  cp -R code-film-studio/skills/* ~/.claude/skills/
  ```
- **Cursor / Codex / Windsurf / Other Agents:**
  Point the agent at `code-film-studio/skills/make-film/SKILL.md` (for example, reference `@code-film-studio/skills/make-film/SKILL.md` in your prompt or place `skills/*` in `.agents/skills/`).

### 3. Prompt Commands Once Loaded
- **Full end-to-end film from any prompt, script, or voiceover:**
  - `/make-film Make a 45-second 16:9 video explaining why ice is slippery in awaken style`
  - `/make-film Build a vertical 9:16 short from my ./voiceover.mp3 in arctic style`
- **Step-by-step stage commands:**
  - `/new-video projects/my-film` — scaffold project, story, cast, locations & storyboard
  - `/video-styles projects/my-film --at 5.0` — render a 9-style comparison grid
  - `/video-sound projects/my-film` — spot procedural music, ambience & 35+ Foley SFX and master `-14 LUFS` audio
  - `/render-video projects/my-film` — render `<project>/exports/final.mp4`, export `.srt/.vtt`, launch `serve.mjs`, and run frame-decoded `qa.py`

---

## Repository Structure

- **`code-film-studio.plugin`** — Ready-to-distribute packaged plugin archive (`ZIP` format).
- **`code-film-studio/`** — Canonical plugin source (`v2.1.0`):
  - `.claude-plugin/plugin.json` — Plugin manifest.
  - `skills/make-film/` — Master end-to-end production skill, `references/*.md`, and shared `kit/` (`engine/`, `audio/`, `tools/`, `render.mjs`, `serve.mjs`, `examples/what-if-demo/`).
  - `skills/{new-video,video-styles,video-sound,render-video}/` — Stage slash-command skills sharing `make-film/kit` and `make-film/references`.
  - `pack_plugin.py` — Regenerates `kit/tools/verify_kit.py` SHA-256 hashes and builds `code-film-studio.plugin`.
  - `tests/` — Automated Node (`test_engine.mjs`) and Python (`test_studio_tools.py`) test suites.
- **`projects/never-touch/`** — Full 12-shot, `66.0s` showcase film (*"Why You Never Touch Anything"*) built end-to-end with the studio pipeline.

---

## Quick Verification & Packaging

```bash
python3 code-film-studio/pack_plugin.py
node --test code-film-studio/tests/test_engine.mjs
python3 code-film-studio/tests/test_studio_tools.py
```
