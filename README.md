# Workshop — Unified Film Studio `Skill` (`v2.2.0`)

Drop **`Skill/`** (or upload **`Skill.zip`**) into Claude, Qwen, Cursor, Codex, or OpenCode to turn your agent into a **complete animated video, voiceover, soundtrack, and YouTube thumbnail studio** — 100% free, code-driven, and autonomous.

---

## 1. Quick Attach (One-Time Setup)

### Grab Only `Skill` From GitHub
```bash
git clone --filter=blob:none --no-checkout https://github.com/AsuraXP/Workshop.git
cd Workshop
git sparse-checkout init --cone
git sparse-checkout set Skill
git checkout
```

### Attach to Your Agent
- **Web / Desktop UI ("Upload Skill" in Claude.ai, Qwen Agent Builder, etc.):** Upload **`Skill.zip`**.
- **Claude Code CLI:**
  ```bash
  mkdir -p ~/.claude/skills && cp -R Skill ~/.claude/skills/code-film-studio
  ```
- **Qwen-Code / Codex / OpenCode / Cursor:**
  ```bash
  mkdir -p .agents/skills && cp -R Skill .agents/skills/code-film-studio
  ```
  *(Or keep `Skill/` in your project folder and mention **`@Skill/SKILL.md`** in chat!)*

---

## 2. Prompt Shortcuts Cheat Sheet (Tips & Tricks)

You do **not** need to write long technical instructions. Just drop any of these **Shortcut Tags** into your prompt and `Skill/SKILL.md` automatically configures the camera language, script POV, pacing, voice casting, loudness target, aspect ratio, and thumbnail!

### A. Video Type Shortcuts (Pick 1)

| Shortcut | Best For | What the Agent Does Automatically |
|----------|----------|-----------------------------------|
| **`[SIGNATURE]`** ⭐ *(Flagship House Style!)* | **Exact format of *"Why You Never Touch Anything"*** | **5-Act, 10–12 shot ~60s film (`Skill/references/signature-format.md`):** 2nd-person Narrator (`Brian` in `edge-tts`) + witty skeptical Co-Star (`af_heart` in `Kokoro`, 3 funny interruptions) + visual `MC v2` protagonist; alternates Cozy Room → Dark Blueprint Zoom → Bright Daylight Gag → Extreme Stakes Climax → Warm `@awaken` Sunset Balcony ending! |
| **`[EXPLAINER]`** | Straight single-voice science/tech/history | `<3s` curiosity hook, 2nd-person *"you"*, macro zoom diagrams + animated `statCard`/`compareBars`, crisp `-14 LUFS` web master (`Brian` narrator). |
| **`[2ND-PERSON]`** | Immersive *"What if you..."* / *"You wake up..."* videos | Pure 2nd-person storytelling, slow atmospheric camera pushes, **no** charts or UI clutter, `-16 LUFS` cinema dynamics. |
| **`[STORY]`** | 3rd-person tales, fables, mini-dramas | Expressive `MC v2` character acting, `bigFace` emotional close-ups, sectioned score arc (`somber` → `wonder` → `uplift`). |
| **`[DIALOGUE]`** | 2+ characters talking, comedy skits, debates | Casts distinct voices (`Brian` + `af_heart` by default), cuts on natural breath pauses (L-cuts), locks 180° camera sides. |
| **`[MY-VO]`** | Animating **your own** recorded voiceover | Keeps your `.mp3`/`.wav` 100% untouched, runs Whisper word-sync, auto-ducks music `-9 dB` under your voice, animates to your cadence. |
| **`[SHORT]`** | YouTube Shorts, Reels, TikTok (`9:16`) | Renders `1080×1920` vertical, `<1.5s` hook, fast `2.5–4s` cuts, burned-in captions, plus a `9:16` vertical cover thumbnail. |
| **`[SILENT]`** | Visual poetry, lo-fi / music-driven shorts | Zero dialogue — pure visual acting, rich Foley (`rain`, `footstep`, `wind`), and `+4 dB` fuller musical score. |

---

### B. Voice Shortcuts (`edge-tts` Male + `Kokoro` Female — 100% Free)

`Skill/kit/audio/tts.py` automatically combines **`edge-tts`** (for natural male voices) and **`Kokoro`** (for natural female voices):

| Shortcut | What Voice(s) Get Used |
|----------|------------------------|
| *(no tag / `@voice:male`)* | **Main Male Locked:** `edge-tts` → **`en-US-BrianMultilingualNeural`** (`brian`) — warm, clear signature narrator. |
| **`@voice:female`** | **Main Female Locked:** `Kokoro` → **`af_heart`** — flagship natural, expressive female narrator. |
| **`@voice:pair`** | **Signature Duo:** **`brian`** (`edge-tts`) + **`af_heart`** (`Kokoro`) — ideal for co-hosted explainers & 2-person skits. |
| **`@voice:auto`** | **Smart Casting:** Agent picks the best-fitting male voice(s) from **`edge-tts`** (`brian`, `andrew`, `eric` deadpan, `christopher` deep/noir, `guy` energetic, `ryan` UK, `roger` elder) and female voice(s) from **`Kokoro`** (`af_heart`, `af_bella` emotional, `af_sarah` crisp science, `af_nicole` calm/noir, `af_nova` bright/short, `af_sky` curious, `bf_emma` UK) per character & genre! |

*(Want to force one specific character voice? You can even write `@voice:christopher` or `@voice:bf_emma`! Run `python3 Skill/kit/audio/tts.py --list-voices` anytime to see the full table.)*

---

### C. Visual Style Shortcuts (9 Built-In Looks)

Drop any `@style` tag into your prompt:
- **`@awaken`** *(Default)* — Warm twilight indigo + sunset peach/amber rim light (Kurzgesagt / Awaken curiosity vibe)
- **`@daylight`** — Bright sky, crisp cream, high-key comedy & everyday slice-of-life
- **`@cinema`** — Storybook slate-navy & warm ember gold for narrative drama
- **`@noir`** — High-contrast midnight shadows & silver rim light for mystery / suspense / horror
- **`@arctic`** — Deep glacial navy & glowing ice-cyan for physics, coding, AI, medicine
- **`@emerald`** — Bioluminescent forest-mint & gold for biology, nature, climate
- **`@ember`** — Volcanic crimson, copper & sparks for extreme physics, space, action
- **`@sakura`** — Dusk plum & soft rose-peach haze for memory, romance, reflective essays
- **`@retro`** — Vintage teal, mustard & risograph print grain for history & psychology

---

### D. Thumbnail & Workflow Shortcuts

| Shortcut | What Happens |
|----------|--------------|
| **`@thumb`** *(on by default!)* | Exports a hero reference frame (`exports/thumbnail_ref.png`) + style-locked `MC v2` prompt (`production/thumbnail_prompt.md`), calls **your agent's AI image generator** for high-res art, and stamps crisp `<2 MB` YouTube-ready typography (`exports/thumbnail.png` & `.jpg`)! |
| **`@thumb:code`** | Generates the thumbnail purely from the Canvas hero frame + contrast boost + bold hook text (no AI image call). |
| **`@no-thumb`** | Skips thumbnail generation. |
| **`@pause`** | Stops after writing the script + rendering a **9-style comparison grid (`exports/styles.png`)** so you can pick your favorite style/script before the full MP4 render! |

---

## 3. Copy-Paste Example Prompts

- **⭐ Flagship House Style (Exact *"Why You Never Touch Anything"* Recipe!):**
  > `[SIGNATURE] Make a 65s video about why time actually runs slightly slower at your feet than at your head.`
  >
  > `[SIGNATURE] Make a 60s video about why mirrors don't actually flip left and right—they flip front and back.`
  >
  > `[SIGNATURE] Make a 65s video about why there is no such thing as the color pink in the rainbow.`

- **Classic Single-Voice Explainer (`Brian` voice + AI Thumbnail):**
  > `[EXPLAINER] @awaken @thumb Make a 60s video about why airplanes don't flap their wings.`

- **Female-Narrated Science Video (`Kokoro af_heart`):**
  > `[EXPLAINER] @arctic @voice:female Make a 50s video on how noise-canceling headphones erase sound using destructive interference.`

- **Immersive 2nd-Person Mystery (Auto-cast deep narrator, no UI clutter):**
  > `[2ND-PERSON] @noir @voice:auto Make a 1-minute story: You wake up on a night train where every passenger is frozen mid-sentence except you.`

- **Two-Character Comedy / Skit (`Brian` + `af_heart`):**
  > `[DIALOGUE] @daylight @voice:pair Make a 55s comedy where a skeptical friend tries to prove gravity is optional.`

- **Fast Vertical Short / Reel (`9:16`):**
  > `[SHORT] @ember @voice:auto Make a 35s vertical short about what happens in the first millisecond of a supernova.`

- **Animate Your Own Uploaded Voiceover:**
  > `[MY-VO] @cinema Animate ./my_recording.mp3 into a 16:9 story video and generate a matching @thumb.`

- **Preview Styles Before Committing to Full Render:**
  > `[STORY] @pause @voice:auto Plan a 60s fable about the last lighthouse keeper and show me the 9-style preview sheet first.`

---

## 4. Pro Tips for Diverse Videos

1. **Mix & Match Both Aspect Ratios From One Build:** Once a project is built in `projects/<name>`, ask your agent: *"Also render a `9:16` vertical cut of this project"* — every scene uses `V(landscape, vertical)` coordinates so it reflows cleanly to `1080×1920` without rewriting the film!
2. **Keep a Consistent Channel Identity — or Switch Per Series:** Leave voice untouched for a signature `Brian` (`edge-tts`) explainer channel, use `@voice:female` for a signature `af_heart` (`Kokoro`) channel, and use `@voice:auto` whenever making multi-character stories so every character gets their own distinct voice.
3. **AI Thumbnail + Typo-Free Hook Text:** AI image models sometimes misspell small words. Tell your agent `--hook "ZERO TOUCHES?"` (2–4 punchy words): `thumbnail.py` tells the AI model to leave clean negative space on the left third, then stamps razor-sharp, outlined YouTube text under `2 MB`!
4. **Watch Interactively While Editing:** Ask your agent to run `node Skill/kit/serve.mjs --project projects/<name>` to open the browser **Screening Room** + **Interactive Canvas Studio** where you can scrub frame-by-frame and toggle styles live.

---

## Verification & Packaging

```bash
python3 tests/pack_skill.py
node --test tests/test_engine.mjs
python3 tests/test_studio_tools.py
```
