# Dual-Engine Voice Synthesis (`tts.py`) & Thumbnail Pipeline (`thumbnail.py`)

---

## 1. Dual-Engine Voice Policy (`audio/tts.py`)

Code Film Studio pairs **two 100% free engines** so male and female voices both sound natural without paid API keys:

| Role | Locked Primary Choice | Engine | Voice ID |
|------|-----------------------|--------|----------|
| **Main Male** *(default single narrator, explainers, 2nd-person, male lead)* | `--voice brian` | **`edge-tts`** | `en-US-BrianMultilingualNeural` |
| **Main Female** *(default female narrator, 2-host co-star, female lead)* | `--voice af_heart` | **`Kokoro`** | `af_heart` |

### Additional Voices (`@voice:auto` Character & Mood Casting)
When a film has extra characters or a specific mood (`noir`, `short`, British documentary, comedy), pick **male voices from `edge-tts`** and **female voices from `Kokoro`** (`python3 <KIT>/audio/tts.py --list-voices`):

- **Male (`edge-tts`):**
  - `brian` — `en-US-BrianMultilingualNeural` *(Main Male: warm, natural conversational host)*
  - `andrew` — `en-US-AndrewMultilingualNeural` *(Empathetic friend / grounded 3rd-person storyteller)*
  - `eric` — `en-US-EricNeural` *(Crisp, dry, skeptical foil / deadpan comedy)*
  - `christopher` — `en-US-ChristopherNeural` *(Deep, serious `noir` / cinema / suspense narrator)*
  - `guy` — `en-US-GuyNeural` *(Fast, punchy `[SHORT]` / action host)*
  - `ryan` — `en-GB-RyanNeural` *(British documentary / fable narrator)*
  - `roger` — `en-US-RogerNeural` *(Mature professor / mentor / elder)*
- **Female (`Kokoro`):**
  - `af_heart` — `af_heart` *(Main Female: flagship warm, expressive narrator & co-host)*
  - `af_bella` — `af_bella` *(Intimate emotional storytelling & `[2ND-PERSON]` narration)*
  - `af_sarah` — `af_sarah` *(Crisp science / tech `[EXPLAINER]` narrator)*
  - `af_nicole` — `af_nicole` *(Calm, soft nocturnal / `@noir` atmosphere)*
  - `af_nova` — `af_nova` *(Bright, energetic `[SHORT]` & comedy dialogue)*
  - `af_sky` — `af_sky` *(Light, curious conversational partner)*
  - `bf_emma` — `bf_emma` *(Warm British storyteller)*

### Batch Cue Synthesis & Breath-Pause Timing
Write `<project>/audio/cues.json` and run:
```bash
python3 <KIT>/audio/tts.py --project <project> --cues <project>/audio/cues.json
```
`tts.py` synthesizes `<project>/audio/lines/<id>.wav` (`48 kHz`), captures word timestamps when available, and writes `<project>/audio/tts_report.json` with exact `duration`, `speech_start`, `speech_end`, and internal breath `pauses` (`>= 0.20s`). Use those exact durations to size `story/shots.json` and land visual **L-cuts** inside natural breath pauses!

---

## 2. Thumbnail Generation (`tools/thumbnail.py`)

Every video deliverable should include a high-contrast thumbnail (`exports/thumbnail.png` + `<2 MB` `exports/thumbnail.jpg`).

### Workflow A — Host Agent Has an AI Image Generator (`@thumb` / `@thumb:ai` — Preferred!)
1. Export the peak hero reference frame + style-locked `MC v2` prompt:
   ```bash
   python3 <KIT>/tools/thumbnail.py --project <project> --mode prompt --hook "ZERO TOUCHES?"
   ```
   This saves `<project>/exports/thumbnail_ref.png` and `<project>/production/thumbnail_prompt.md` (locking the `MC v2` dark circular head, crescent rim light, cream vertical eyes, pill brows, coat shading, and exact style hex palette).
2. Call the host agent's **AI image generation / image-editing tool** using the prompt in `production/thumbnail_prompt.md` (passing `exports/thumbnail_ref.png` as reference if supported) and save the raw image to `<project>/exports/thumbnail_ai_raw.png`.
3. Stamp crisp, typo-free hook typography & export `<2 MB` YouTube-ready files:
   ```bash
   python3 <KIT>/tools/thumbnail.py --project <project> --mode overlay --in-image <project>/exports/thumbnail_ai_raw.png --hook "ZERO TOUCHES?" --badge "PHYSICS"
   ```
   *(Omit `--hook` in step 3 if the AI generator already rendered clean, accurate typography.)*

### Workflow B — Standalone Code Thumbnail (`@thumb:code` or No Image Tool Available)
```bash
python3 <KIT>/tools/thumbnail.py --project <project> --mode code --hook "ZERO TOUCHES?" --badge "PHYSICS"
```
Renders the climax canvas frame at full resolution, enhances contrast/vibrance, adds a cinematic readability gradient, and composites bold hook text into `exports/thumbnail.png` and `exports/thumbnail.jpg`.
