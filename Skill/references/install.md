# Environment Setup & Troubleshooting (`doctor.py`)

Run the diagnostic check first whenever setting up a new machine or container:
```bash
python <KIT>/tools/doctor.py
```

---

## 1. Required & Optional Dependencies

### Core (Required)
1. **Node.js 18+** (`node`, `npm`)
2. **Python 3.10+** with DSP & QA packages:
   ```bash
   pip install numpy scipy pillow
   ```
3. **FFmpeg:**
   - System `ffmpeg` + `ffprobe` (`brew install ffmpeg`, `sudo apt-get install -y ffmpeg`, or `winget install Gyan.FFmpeg`), **OR**
   - Pure-pip static binary fallback (ideal for containers without `sudo`/root):
     ```bash
     pip install imageio-ffmpeg
     ```
     `tools/common.py` and `render.mjs` automatically discover `imageio-ffmpeg` when `ffmpeg` is not on `PATH` (or honor `FFMPEG_BIN=/path/to/ffmpeg`).

### Rendering Backends (At Least One Required)
Code Film Studio supports **two** rendering backends in `kit/render.mjs`:

- **Backend A — Playwright Headless Chromium (Recommended; supports both 2D Canvas and Three.js 3D WebGL shots):**
  ```bash
  cd <KIT>
  npm install
  npx playwright install chromium
  ```
  *(On minimal Linux servers if Chromium shared libs are missing: `npx playwright install-deps chromium`.)*

- **Backend B — Pure Node `@napi-rs/canvas` (Zero-browser fallback for all 2D/2.5D films in restricted containers/CI):**
  ```bash
  cd <KIT>
  npm install @napi-rs/canvas
  ```
  `render.mjs` automatically falls back to `@napi-rs/canvas` when Chromium is unavailable (or when `--backend node` is passed) and renders 2D films at `25–40+ fps`!

### Optional Speech & Vision Packages
- **Built-In Dual-Engine Speech Synthesis (`audio/tts.py`):**
  ```bash
  # Primary Male Engine (en-US-BrianMultilingualNeural + male cast):
  pip install edge-tts

  # Primary Female Engine (af_heart + female cast):
  pip install kokoro soundfile
  # (Or lightweight CPU ONNX runtime: pip install kokoro-onnx soundfile)
  ```
- **Uploaded Voiceover Word-Timestamp Alignment (`tools/transcribe.py`):**
  ```bash
  pip install faster-whisper
  ```
- **Faster Video Frame Decoding in `tools/qa.py`:**
  ```bash
  pip install opencv-python-headless
  ```
  *(Optional — `qa.py` falls back automatically to an FFmpeg raw-frame pipe if `cv2` is absent.)*
