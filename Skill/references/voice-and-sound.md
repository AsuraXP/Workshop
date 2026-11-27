# Dual-Engine Sparse Voice (`tts.py`), Foley & Score Mastering (`mix.py`)

In Awaken-style films, **silence, ambience, Foley, and swelling score are the primary soundtrack**—voice is used sparingly (`<= 40%` of runtime, `<= 12–14` words per cue) so it never crowds out visual pacing.

---

## 1. Dual-Engine Free TTS (`Skill/kit/audio/tts.py`)

`tts.py` pairs **`edge-tts`** (for natural male voices) and **`Kokoro`** (for natural female voices) with automatic cross-engine fallback:

| Role | Default Preset | Engine | Voice ID |
|------|----------------|--------|----------|
| **Main Male** *(default narrator / male lead)* | `brian` | **`edge-tts`** | `en-US-BrianMultilingualNeural` |
| **Main Female** *(default co-star / female narrator)* | `af_heart` | **`Kokoro`** | `af_heart` |

### Additional Cast Voices (`@voice:auto` — `python3 <KIT>/audio/tts.py --list-voices`)
- **Male (`edge-tts`):** `brian` (warm main), `andrew` (empathetic friend), `eric` (dry/skeptical foil), `christopher` (deep noir/cinema), `guy` (energetic), `ryan` (British), `roger` (elder/mentor).
- **Female (`Kokoro`):** `af_heart` (warm main), `af_bella` (intimate story), `af_sarah` (crisp science), `af_nicole` (soft nocturnal), `af_nova` (bright playful), `af_sky` (curious friend), `bf_emma` (British).

### Audio-First Cue Generation & Sparse-Voice Check
Author `<project>/audio/cues.json` **before** locking `story/shots.json` durations:
```json
[
  { "id": "s01", "voice": "brian",    "text": "Right now, you feel the warm mug in your hand." },
  { "id": "s03", "voice": "af_heart", "text": "Hold on. I am poking this table right now." }
]
```
Run:
```bash
python3 <KIT>/audio/tts.py --project <project> --cues <project>/audio/cues.json
```
- Writes `48 kHz` WAVs to `audio/lines/<id>.wav` and exact `duration`, `speech_start`, `speech_end`, and internal breath `pauses` (`>= 0.20s`) to `audio/tts_report.json`.
- **Automatic Pacing Guardrail:** `tts.py` warns immediately if any line exceeds `14 words` or if total voiced speech exceeds `42%` of `config.json -> duration`. Trim lines right here before animating!
- **Delayed Placement & L-Cuts:** Place `dialogue` cues at `at: 0.8 .. 1.6s` inside a shot (not always `0.0s`!) so visuals establish first, and leave `1.2–2.5s` of quiet tail after `speech_end` so the moment breathes. Because `mix.py` does not truncate clips at `shot.dur`, two-clause lines can also bridge smoothly across an **L-cut** at a measured breath pause.

---

## 2. Sectioned Procedural Score (`audio/music.py`)

Shape the emotional arc across acts in `config.json`:
```json
"music": {
  "sections": [
    { "at": 0.0,  "mood": "curious", "gain": -15.5 },
    { "at": 34.0, "mood": "tense",   "gain": -15.0 },
    { "at": 52.0, "mood": "uplift",  "gain": -14.5 }
  ]
}
```
Moods: `wonder`, `curious`, `tense`, `uplift`, `action`, `somber`, `playful`, `none`. `mix.py` ducks the score `-9 dB` while someone speaks and **blooms it back up** during every silent visual beat!

---

## 3. Ambience & 35+ Foley SFX (`audio/sfx.py`)

Run `python3 <KIT>/audio/sfx.py --list` anytime.
- **Ambience (`shot.ambience`):** `roomtone` (`room`), `wind`, `city` (`night`), `rain`, `murmur` (`crowd`), `hum` (`-26` to `-22 dB`).
- **Foley & Accents (`shot.sfx`, `1–4` cues in shot-local `at` seconds):**
  - *Motion:* `swish` (`whoosh_soft`, `slide`), `whoosh`, `riser`, `slowmo`, `freeze`
  - *Impacts:* `impact` (`boom`), `hit` (`slam`), `kick` (`thud`), `stinger`, `thunder`, `flash`
  - *Subtle World & UI:* `footstep` (`step`), `pop`, `blip` (`ping`), `counter`, `ding` (`chime`), `shimmer` (`sparkle`), `tick`, `clock`, `heartbeat`, `buzz`

---

## 4. Two-Pass Loudness Mastering (`audio/mix.py`)

```bash
python3 <KIT>/audio/mix.py --project <project>
```
Runs two-pass linear EBU R128 `loudnorm` to hit `cfg.loudness` (`-14.0 LUFS` default; `-16.0` for quiet narrative shorts) with `-1.5 dBTP` ceiling, and records `speech_ratio` in `build/mix_stats.json`. Export subtitles via `python3 <KIT>/tools/export_srt.py --project <project> --vtt`.
