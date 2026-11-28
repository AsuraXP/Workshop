# Awaken Direction Bible — Sparse-Voice Visual Cinema

Every film built with this skill follows **one unmistakable creative identity**: atmospheric, character-driven 2.5D/3D visual storytelling where **images, camera movement, Foley, and swelling music carry 60–70% of the film**, and **voice steps in only for the 30–40% where words truly add weight**.

---

## 1. The Three Laws of Sparse-Voice Pacing

1. **Never Write a Radio Essay (`<= 40%` Speech Ratio, `<= 12–14` Words per Cue):**
   - Never narrate what the viewer can already see on screen.
   - Cap every spoken cue at **`5–14 words` (`1.5–3.2s`)**—one sharp thought, never a multi-sentence lecture paragraph.
   - Total voiced audio across the entire film must stay **`<= 40%`** of total runtime (`tts.py` and `qa.py` actively measure and warn if speech exceeds `42–45%`).
2. **Inside Every Beat: *Show Quietly → Speak Briefly → Let It Breathe*:**
   - **Visual Setup (`1.0–2.5s` quiet):** Establish the room, footsteps, window light, or physical action with room tone + Foley before anyone speaks.
   - **Necessary Line (`1.5–3.0s`):** A quiet 2nd-person hook or a wry character reaction.
   - **Visual & Sonic Payoff (`1.5–3.5s` quiet):** Stop talking while the zoom, transformation, spark, or emotional beat lands—letting `mix.py` lift the music back up from `-9 dB` ducking!
3. **Dedicated Silent Visual Shots (`>= 30%` of Shots Have Zero Speech):**
   - In a 10–12 shot film, at least **3–4 shots** should have **no spoken words at all**—carried purely by `MC v2` facial acting (`brow`, `browTilt`, `autoBlink`), camera push/pan, Foley (`footstep`, `pop`, `chime`, `boom`), and score.

---

## 2. Cast & Voice Dynamic

- **Arena Agent — Off-Screen Male Narrator (`voice-00` profile):**
  Use the warm, curious explanatory voice from *Why You Never Actually Touch Anything* for the default narrator in both `16:9` and `9:16` Awaken films. Register/select it in the active session as described in `voice-and-sound.md` when its historical ID is unavailable.
- **Arena Agent — Female Co-Star / Narrator (`voice-01` profile):**
  Use the dry, comedic, skeptical Nora voice for the female character or female narration. Keep her brief reactions grounded in physical comedy or wonder; do not reuse the source film's dialogue.
- **Non-Arena local TTS fallback:**
  Use `edge-tts` `brian` (`en-US-BrianMultilingualNeural`) for a warm, calm 2nd-person narrator and Kokoro `af_heart` for the witty/skeptical co-star. Keep these as local-backend defaults only; do not silently substitute them in Arena-produced films.
- **Visual Protagonist (`MC v2` in `COATS.cream`):**
  Silent physical anchor in the world—holding the recurring prop via `handPos()`, testing the environment, reacting in `bigFace` close-ups, and sharing the closing twilight tableau.
- *(For solo contemplative Arena stories, use only `voice-00` if narration is needed; for a female lead or co-star, use `voice-01`. Outside Arena, use just local `brian` or `af_heart` sparsely. Keep the speech limits and dialogue in `voice-and-sound.md`.)*

---

## 3. The 5-Act Visual Arc (~50–70s, 10–12 Shots)

Alternate **warm grounded spaces** and **focused visual cutaways** so the eye never tires:

| Act | Shots | World & Lighting | Storytelling Job |
|-----|-------|------------------|------------------|
| **1. Quiet Hook & Pushback** | `s01–s03` | Cozy interior (`dusk` / warm window beam + pendant glow) | Quiet visual opening + everyday prop (`handPos`). One short hook line; Co-Star physically tests it (`shockwave` / Foley). |
| **2. Macro / Mechanism Reveal** | `s04–s06` | Deep dark cutaway (`night` / `#101528` blueprint) | Zoom inside the hidden reality (`10,000,000x`, orbitals, force vectors, minimal clean labels—never walls of text). Let the animation move in silence between short lines. |
| **3. Daylight Breather Beat** | `s07` | High-key exterior (`daylight` park / rooftop / street) | Palette reset! Bright sky + physical visual gag + Co-Star's wry one-liner. |
| **4. Human Feel & Extreme Stakes** | `s08–s10` | Split cutaway + dark containment/test space (`tense` score) | `bigFace` (`expr: 'awe'`) showing how we perceive it -> *"What if we forced it?"* silent visual buildup -> `impact`/`flash` climax -> quiet deadpan reaction hold. |
| **5. Awaken Twilight Payoff** | `s11–s12` | Panoramic sunset balcony / hill (`dusk` + `skyStreaks` + `bokeh` + `uplift` score) | Return to human warmth + Act 1's prop. Settle into a calm `"hold": true` final shot with a 2-line poetic `endCard` (never a `"Subscribe"` button). |

---

## 4. Continuity Ledger (`production/continuity.md`) & Aspect (`16:9` / `9:16`)

Before coding `scenes/sXX.js`, lock a row per shot in `production/continuity.md`:
1. **Location & Light Vector:** Reusable `scenes/sets/*.js` module + world-space `rim.dir` (e.g. `[1, -0.32]`), kept identical for every character in that room regardless of `facing: 1 | -1`.
2. **180° Screen Geography:** Keep conversing characters on consistent left/right screen sides across cuts.
3. **Prop Socket Ownership:** Lock held props via `handPos(opts, 'F' | 'B')`—never hardcode `[x + 40, y - 120]`.
4. **Aspect Reflow (`16:9` default + `9:16` vertical):** Wrap layout coordinates and scales in `V(landscapeVal, verticalVal)` so both widescreen (`1920×1080`) and vertical (`1080×1920`) cuts frame cleanly inside safe zones.
