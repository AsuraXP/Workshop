# Production Roles, Crew Handoffs & Continuity

When producing a film or video, operate as a coordinated **virtual animation studio**. You do not need theatrical role-play in chat—apply each department's discipline at its gate and record concrete decisions in `<project>/production/*.md` so nothing drifts across shots.

---

## 1. The 12 Studio Departments

| Gate | Department | Responsibility & Output Artifact |
|------|------------|----------------------------------|
| **1. Brief & Story** | **Showrunner / Producer** | Clarifies input mode (voiceover, script, prompt/topic, or silent/music), target runtime, aspect (`16:9` or `9:16`), and scope -> `production/brief.md`. |
| **1. Brief & Story** | **Researcher & Writer** | Verifies factual claims/numbers when educational; writes structured narration, sparse character dialogue, or silent visual beats -> `production/script.md`. |
| **2. Design** | **Character Designer** | Configures recurring **`MC v2`** cast (`coat`, `outfit`, `rim`, signature expressions) -> `production/cast.md` + `scenes/cast.js`. |
| **2. Design** | **Production Designer & Lighting** | Designs reusable location modules (`scenes/sets/*.js`), selects `style` + per-location `mood()`, and locks world-space light direction (`rim.dir`) -> `production/locations.md`. |
| **3. Editorial Plan** | **Storyboard & Cinematographer** | Breaks timeline into motivated shots (`story/shots.json`), varying shot scale (wide / medium / `bigFace` close-up / schematic insert) and planning camera moves vs deliberate `hold: true` -> `production/continuity.md`. |
| **4. Sound Plan** | **Composer & Sound Designer** | Plans score mood arc (`music.sections` or `mood`), per-shot ambience beds, motivated Foley/UI SFX, dialogue/VO ducking, and target LUFS -> `production/audio.md`. |
| **5. Animation** | **Lead Animator & Layout** | Codes `scenes/sXX.js` using shot-local `t` (`0 .. info.dur`), anticipation/overshoot, secondary breathing/blinks, continuous brow/mouth transitions, and `handPos()` prop sockets. |
| **6. Mix & Render** | **Finishing Engineer** | Runs `audio/mix.py` (two-pass linear `loudnorm`), `render.mjs`, and `tools/export_srt.py` when subtitles/dialogue exist. |
| **7. QA & Critic** | **Technical QA & Critic** | Runs `tools/qa.py` on the rendered MP4, inspects `qa/*.jpg` + `qa/report.json`, scores the 8-category Critic Rubric in `production/qa.md`, and loops back to fix every Critical or Major defect before delivery. |

---

## 2. Scaling Process by Runtime

- **Short (`<= 60s`, 6–15 shots):** Complete `production/` docs concisely, build reusable `cast.js` + 1–3 `sets/*.js`, animate all shots, render preview, run `qa.py`, polish, and render final.
- **Medium (`1–5 min`, 15–65 shots):** Group shots into **sequences** (~30–45s each). Build shared `cast.js` and `sets/*.js` first, then animate and contact-sheet inspect one sequence at a time (`render.mjs --from A --to B --preview`) so context stays sharp and pacing never degrades in the back half.
- **Long-form (`> 5 min`, 65+ shots):** Divide into named **chapters/acts** (like Awaken's multi-chapter essays). Lock chapter durations and `production/continuity.md` upfront, render per-chapter preview reels, verify transitions across chapter boundaries, then assemble/render the master.

---

## 3. The Continuity Ledger (`production/continuity.md`)

Animation generated in code breaks immersion immediately if props teleport, coats change color mid-scene, characters flip screen sides across a cut (violating the 180-degree line), or rim light jumps from right to left inside the same room.

Before coding `scenes/sXX.js`, fill a row per shot in `production/continuity.md`:
1. **Location & Mood:** Which `scenes/sets/*.js` module and `mood()` preset is active.
2. **Screen Geography (180° Rule):** Which side of frame (`x`, `facing: 1 | -1`) each character occupies. Keep screen left/right consistent across cuts within a conversation unless a visible camera orbit or character walk crosses the axis on-screen.
3. **Wardrobe & State:** Exact `CAST.<name>` preset + any persistent state change (e.g., puts on glasses in `s04` -> keeps them in `s05..s08`).
4. **Prop Socket Ownership:** Any held object must specify which character and hand (`handPos(opts, 'F' | 'B')`) owns it.
5. **World Light Vector:** `rim.dir` is in **world space** (`[1, -0.32]` = light from upper right of screen). Keep `rim.dir` consistent for every character in the same shot regardless of `facing: 1` or `-1` (`drawFigure` handles mirroring automatically!).
