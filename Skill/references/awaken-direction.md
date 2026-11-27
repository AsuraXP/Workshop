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

- **Off-Screen Narrator (`edge-tts` → `brian` / `en-US-BrianMultilingualNeural`):**
  Warm, calm 2nd-person voice (*"Right now, you feel..."*). Drops short, intriguing turns rather than textbook definitions.
- **On-Screen Witty / Skeptical Co-Star (`Kokoro` → `af_heart`, `MC v2` in `cardigan`):**
  Steps in `2–3` times per minute with short, human reactions (*"Hold on. I'm poking the table right now."*, *"Okay, suddenly a huge fan of the gap."*) that ground big ideas in physical comedy or wonder.
- **Visual Protagonist (`MC v2` in `COATS.cream`):**
  Silent physical anchor in the world—holding the recurring prop via `handPos()`, testing the environment, reacting in `bigFace` close-ups, and sharing the closing twilight tableau.
- *(For solo contemplative stories, use just `brian` or `@voice:female` `af_heart` sparsely; for multi-character stories, `@voice:auto` casts additional male voices from `edge-tts` and female voices from `Kokoro`.)*

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
