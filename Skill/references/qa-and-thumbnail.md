# Frame-Decoded QA (`qa.py`), Thumbnails (`thumbnail.py`) & Setup (`doctor.py`)

---

## 1. Environment Check & Auto-Bootstrap (`tools/doctor.py`)

Run `python3 <KIT>/tools/doctor.py` at Gate 1:
- **Python (`3.10+`):** `pip install numpy scipy pillow opencv-python-headless imageio-ffmpeg edge-tts soundfile` + `pip install kokoro` (or `kokoro-onnx`) for `af_heart` female speech.
- **Node (`18+`):** `npm --prefix <KIT> install @napi-rs/canvas --no-save` (fast lossless 2D RGBA pipe to FFmpeg) or `cd <KIT> && npm install && npx playwright install chromium` (for 2D + Three.js 3D WebGL shots).

---

## 2. Full-Video Technical & Pacing QA (`tools/qa.py`)

Always run on the rendered `<project>/exports/final.mp4`:
```bash
python3 <KIT>/tools/qa.py --project <project>
```
`qa.py` decodes **every frame** in `O(1)` memory and writes `<project>/qa/overview.jpg`, per-shot 8-frame strips `<project>/qa/sXX.jpg`, and `<project>/qa/report.json`:
1. **Frame, FPS & Duration Match:** Verifies zero frame/audio drift against `story/shots.json`.
2. **Sparse-Voice Ratio Check (`speech_ratio <= 0.45`):** Warns automatically if speech crowds out more than `45%` of the film's runtime.
3. **Unintended Freeze vs `"hold": true`:** Flags accidental dead freezes (`>= 0.75s` without `"hold": true`) and mid-shot jump spikes.
4. **Flash & Broadcast Loudness Audit:** Screens rapid opposing luminance flashes and verifies integrated LUFS (`±2.5 LU` of target) and true peak (`<= -0.5 dBTP`).

### Visually Inspect & Score the 8-Category Critic Rubric (`production/qa.md`)
Inspect `exports/sheet.png`, `qa/overview.jpg`, and key `qa/sXX.jpg` strips visually (catching text overlaps, dark-on-dark silhouettes, or floating props), and require **`>= 24 / 32`** (no category `< 2`, zero `qa.py` errors/warnings) across:
1. Story & Clarity · 2. Visual Contrast (`MC v2` separation) · 3. Composition & Camera · 4. Animation & Acting · 5. Continuity (`handPos`, 180°, `rim.dir`) · 6. Sparse Voice, Music & Foley · 7. Breathing Room & Pacing · 8. Subtitles & Safety.

---

## 3. Awaken Thumbnail Pipeline (`tools/thumbnail.py`)

Every finished film includes `<project>/exports/thumbnail.png` + YouTube `<2 MB` `exports/thumbnail.jpg`:

1. **When Host Agent Has an AI Image Tool (Default):**
   ```bash
   python3 <KIT>/tools/thumbnail.py --project <project> --mode prompt --hook "ZERO TOUCHES?"
   ```
   - Exports `<project>/exports/thumbnail_ref.png` + style-locked `MC v2` prompt in `<project>/production/thumbnail_prompt.md`.
   - Generate high-res art with the host agent's image tool (using `thumbnail_ref.png` as visual reference when supported) -> save `<project>/exports/thumbnail_ai_raw.png`.
   - Composite crisp `0–3` word hook text:
     ```bash
     python3 <KIT>/tools/thumbnail.py --project <project> --mode overlay --in-image <project>/exports/thumbnail_ai_raw.png --hook "ZERO TOUCHES?"
     ```
2. **Standalone Code Fallback (`@thumb:code` or No AI Image Tool):**
   ```bash
   python3 <KIT>/tools/thumbnail.py --project <project> --mode code --hook "ZERO TOUCHES?"
   ```

---

## 4. Live Screening Room (`serve.mjs`)

```bash
node <KIT>/serve.mjs --project <project> --port 4173
```
Binds to `0.0.0.0` with HTTP `206` Range streaming, `.vtt` subtitles, contact-sheet & MP4 download buttons, and live `/kit/player.html` interactive canvas scrubbing.
