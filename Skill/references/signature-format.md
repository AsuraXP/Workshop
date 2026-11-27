# The `[SIGNATURE]` House Format Blueprint ("Never-Touch" 5-Act Curiosity Film)

This is the flagship format of Code Film Studio—the exact structure behind *"Why You Never Touch Anything"*. It blends **second-person curiosity narration**, **a skeptical/witty on-screen co-star who interrupts to test the claim**, **precision dark-blueprint zoom cutaways**, **a bright daylight visual gag**, **an extreme-stakes thought experiment**, and **a warm poetic `awaken` twilight ending**.

Use this blueprint whenever the user writes **`[SIGNATURE]`** (or asks for the studio's signature curiosity-story explainer).

---

## 1. The Cast & Voice Dynamic (`@voice:pair`)

1. **Narrator (`edge-tts` → `brian` / `en-US-BrianMultilingualNeural`, off-screen):**
   - Speaks directly to the viewer in **warm, conversational 2nd-person** (*"Right now, you feel..."*, *"Zoom in ten million times, and your..."*).
   - Carries ~70% of the spoken lines (~7 of 10 cues in a 60s film).
2. **Skeptical / Witty Co-Star (`Kokoro` → `af_heart`, on-screen `MC v2` character with `cardigan` + optional `glasses`):**
   - Interrupts **3 times** (~3 short punchy lines of `3–4.5s` each) at exact structural turns:
     - **Interruption 1 (Act 1):** Tests the claim physically and pushes back (*"Hold on. I am literally poking this table right now."*).
     - **Interruption 2 (Act 3):** Realizes the absurd everyday consequence and celebrates it (*"So technically, I am levitating right now. Honestly, pretty impressive."*).
     - **Interruption 3 (Act 4):** Deadpan relief after seeing the catastrophic extreme (*"Okay, hovering is great. Suddenly a huge fan of the gap."*).
3. **Visual Protagonist (silent on-screen `MC v2` character in `COATS.cream`):**
   - Acts as the viewer's physical stand-in—holding the recurring everyday prop via `handPos()`, reacting with expressive `bigFace` close-ups (`awe`, `surprise`, `joy`), and sharing the final twilight moment with the Co-Star.

---

## 2. The 5-Act, 10–12 Shot Visual & Emotional Arc (~55–70s)

Never stay in one room or one dark diagram for the whole video. Alternate **warm grounded worlds** and **crisp dark cutaways** across 5 distinct acts:

| Act | Shots | Environment & Mood | What Happens Visually & Sonically |
|-----|-------|--------------------|-----------------------------------|
| **Act 1 — Everyday Hook & Pushback** | `s01–s03` (`~0–13s`) | **Cozy Interior (`dusk` / warm window beam + pendant lamp)** | `s01`: Opening title card + recurring everyday prop (e.g., steaming mug in `handPos`). **L-cut** narrator's twist across breath pause into `s02` (`statCard` counter `0` + push-in). `s03`: Co-Star (`af_heart`) physically pokes/tests the object with `shockwave` rings. |
| **Act 2 — Microscopic / System Blueprint** | `s04–s06` (`~13–30s`) | **Deep Dark Cutaway + Blueprint Grid (`night` / `#101528`)** | `s04`: Macro zoom (`10,000,000x` badge + animated lattice/waves + caliper callout). `s05`: Clean architectural diagram of the core mechanism, **L-cut** into `s06` live interaction (`compareBars` hitting `99%` + vector arrows). |
| **Act 3 — Bright Daylight Breather Gag** | `s07` (`~30–35s`) | **High-Key Outdoor (`daylight` park / street / rooftop)** | Palette contrast reset! Bright sky + hills while Co-Star (`af_heart`) delivers Interruption #2 demonstrating the funny real-world implication (e.g., hovering on a bench + high-five spark with Protagonist). |
| **Act 4 — Brain Decode & Extreme Stakes** | `s08–s10` (`~35–53s`) | **Split Cutaway + Dark Containment Lab (`tense` score)** | `s08`: Left diagram card + right `bigFace` (`expr: 'awe'`) showing how the body/mind perceives it. `s09`: *"What if we actually forced it?"*—escalate to extreme physics/consequence (`impact` + `flash` + `stinger`). `s10`: Tight reaction on Co-Star (`af_heart`) beside a tempting prop (`FORCE` button) delivering deadpan Interruption #3. |
| **Act 5 — Poetic `Awaken` Twilight Payoff** | `s11–s12` (`~53–66s`) | **Panoramic Sunset Balcony / Overlook (`dusk` + `skyStreaks` + `bokeh` + `uplift` score)** | Return to the human scale! Warm twilight sky, horizon glow, stars, valley bokeh lights, **callback to Act 1's prop** (e.g., clinking mugs across the invisible gap), settling into a calm `"hold": true` final frame with a short 2-line poetic `endCard` (never a `"Subscribe"` button). |

---

## 3. Signature Craft Details That Make It Shine

- **2 Seamless L-Cuts:** Write `s01` and `s05` narrator lines as two-clause sentences with a natural comma/conjunction pause; inspect `audio/tts_report.json` `pauses` and cut to `s02` / `s06` right inside the `0.25–0.45s` breath pause while the audio continues unbroken.
- **Sectioned Score Arc (`config.json`):** Start in `"curious"` (`-16 dB`), shift to `"tense"` (`-15.5 dB`) during Act 4's extreme stakes, and bloom into `"uplift"` (`-15 dB`) at Act 5's twilight overlook.
- **Prop Continuity (`handPos`):** Introduce one tangible prop in `s01` (mug, key, coin, compass, notebook) locked to `handPos()` and pay it off emotionally in `s11`.
- **Dual Captions:** Set `"storyCaptions": true` with `"speaker": "NORA"` (or Co-Star's name) ONLY on the Co-Star's lines and omit `"speaker"` on Narrator lines so the viewer instantly distinguishes narration from character speech, plus export `exports/subtitles.{srt,vtt}`.
